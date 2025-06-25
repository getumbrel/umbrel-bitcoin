import {setTimeout} from 'timers/promises'

import type WebSocket from 'ws'
import PQueue from 'p-queue'

import {rpcClient} from '../bitcoind/rpc-client.js'
import {blockStream} from './zmq-subscriber.js'

import type {
	BlocksResponse,
	BlockSummary,
	BlockReward,
	BlockSizeSample,
	FeeRatePoint,
	RawBlock,
	RawTransaction,
} from '#types'

// Partial type of bitcoind's getblockstats RPC
type BlockStatsLite = {
	height: number
	subsidy: number
	totalfee: number
	total_weight: number
	total_size: number
	avgfeerate: number
	feerate_percentiles: number[]
	time: number
	blockhash: string
	txs: number
}

const rpcQueue = new PQueue({concurrency: 10})

// Get block stats for height
// caches the BLOCK_STATS_CACHE_DEPTH most recent blocks
const BLOCK_STATS_CACHE_DEPTH = 200
const blockStatsCache = new Map<number, BlockStatsLite>()
async function getBlockStats(height: number) {
	// Check if we have a cached value and return early if so
	const cached = blockStatsCache.get(height)
	if (cached) return cached

	// If not, fetch the block stats over RPC and cache the result
	console.log(`fetching stats for block ${height}`)
	const blockStats = await rpcClient.command<BlockStatsLite>('getblockstats', height)
	blockStatsCache.set(height, blockStats)

	// If we've exceeded the cache depth, delete the oldest entries
	if (blockStatsCache.size > BLOCK_STATS_CACHE_DEPTH) {
		const keys = Array.from(blockStatsCache.keys())
		const sortedKeys = keys.sort((a, b) => a - b)
		const keysToDelete = sortedKeys.slice(0, blockStatsCache.size - BLOCK_STATS_CACHE_DEPTH)
		keysToDelete.forEach((key) => blockStatsCache.delete(key))
	}

	return blockStats
}

// Get stats for the latest N blocks
async function getLatestBlocks(limit: number) {
	// Get the tip height
	const tip = await rpcClient.command<number>('getblockcount')

	// Loop backwards over most recent n blocks from tip
	const blocks = []
	for (let i = 0; i < limit; i++) {
		const height = tip - i
		if (height < 0) break
		blocks.push(rpcQueue.add(() => getBlockStats(height)))
	}

	// Reverse the blocks to get them in chronological order
	blocks.reverse()

	return Promise.all(blocks) as Promise<BlockStatsLite[]>
}

// Block rewards (subsidy + fee totals)
export async function rewards(limit = 144): Promise<BlockReward[]> {
	const stats = await getLatestBlocks(limit)
	return stats.map((s) => ({
		height: s.height,
		subsidySat: s.subsidy,
		feesSat: s.totalfee,
		time: s.time,
	}))
}

// Total block sizes
export async function blockSizes(limit = 144): Promise<BlockSizeSample[]> {
	const stats = await getLatestBlocks(limit)
	return stats.map((s) => ({
		height: s.height,
		sizeBytes: s.total_size,
		time: s.time,
	}))
}

// Fee-rate percentiles (p10/p50/p90)
export async function feeRates(limit = 144): Promise<FeeRatePoint[]> {
	const stats = await getLatestBlocks(limit)
	return stats.map((s) => {
		const [p10, , p50, , p90] = s.feerate_percentiles ?? [0, 0, 0, 0, 0]
		return {height: s.height, p10, p50, p90, time: s.time}
	})
}

const BLOCK_CACHE_DEPTH = 5
const blockCache = new Map<number, BlockSummary>()

async function getBlock(height: number) {
	// Check if we have a cached value and return early if so
	const cached = blockCache.get(height)
	if (cached) return cached

	// If not, fetch the raw block over RPC and cache the result
	console.log(`fetching raw block ${height}`)
	const blockHash = await rpcClient.command<string>('getblockhash', height)
	const raw = await rpcClient.command<RawBlock>('getblock', blockHash, 2)

	// Format the raw block into a summary
	const summary: BlockSummary = {
		hash: raw.hash,
		height: raw.height,
		time: raw.time,
		txs: raw.nTx,
		size: raw.size,
		transactionGrid: transactionGrid(raw.tx, 20),
	}

	// Save in cache
	blockCache.set(height, summary)

	// If we've exceeded the cache depth, delete the oldest entries
	if (blockCache.size > BLOCK_CACHE_DEPTH) {
		const keys = Array.from(blockCache.keys())
		const sortedKeys = keys.sort((a, b) => a - b)
		const keysToDelete = sortedKeys.slice(0, blockCache.size - BLOCK_CACHE_DEPTH)
		keysToDelete.forEach((key) => blockCache.delete(key))
	}

	return summary
}

function transactionGrid(transactions: RawTransaction[], gridSize: number) {
	const TOTAL_BLOCK_SIZE = 4_000_000

	// Calculate possible square sizes
	const squareSizes = Array.from({length: gridSize}, (_, i) => i + 1).map((size) => ({
		size,
		totalWeight: 0,
		numberOfBlocks: 0,
	}))

	// Calculate total weight for all transactions that proportionally fit in each size chunk
	for (const transaction of transactions) {
		const txPercentageOfBlock = transaction.weight / TOTAL_BLOCK_SIZE
		for (const chunk of squareSizes) {
			const chunkPercentageOfGrid = Math.pow(chunk.size / gridSize, 2)
			if (txPercentageOfBlock < chunkPercentageOfGrid) {
				chunk.totalWeight += transaction.weight
				break
			}
		}
	}

	// Calculte the number of squares to represent the total weight for each threshold
	for (const chunk of squareSizes) {
		const chunkPercentageOfGrid = Math.pow(chunk.size / gridSize, 2)
		const chunkPercentageOfBlock = chunk.totalWeight / TOTAL_BLOCK_SIZE
		const numberOfBlocks = Math.round(chunkPercentageOfBlock / chunkPercentageOfGrid)
		chunk.numberOfBlocks = numberOfBlocks
	}

	// Cleanup output
	const output = squareSizes
		.filter((chunk) => chunk.numberOfBlocks > 0)
		.map(({size, numberOfBlocks}) => ({size, numberOfBlocks}))

	return output
}

// Latest N block summaries
export async function list(limit = 20): Promise<BlocksResponse> {
	// get the current tip height to use as the starting point
	const tipHeight = await rpcClient.command<number>('getblockcount')

	// fetch hashes then summaries in batch RPC style
	const blocks = (await Promise.all(
		Array.from({length: limit}, (_, i) => rpcQueue.add(() => getBlock(tipHeight - i))),
	)) as BlockSummary[]

	return {blocks}
}

// WebSocket push for new blocks
export function wsStream(socket: WebSocket) {
	const sendBlock = async (hash: string) => {
		try {
			// Check if we're at the known tip by comparing the block's height to known header height
			const blockchainInfo = await rpcClient.command<{
				blocks: number
				headers: number
			}>('getblockchaininfo')

			// if we're not at the known tip, don't send the block via Websocket, the frontend will continue polling the REST API
			if (blockchainInfo.blocks !== blockchainInfo.headers) return

			// Get the full block data in one RPC call
			const raw = await rpcClient.command<RawBlock>('getblock', hash, 2)

			// Build the complete BlockSummary with fee tiers
			const fullBlock: BlockSummary = {
				hash: raw.hash,
				height: raw.height,
				time: raw.time,
				txs: raw.nTx,
				size: raw.size,
				transactionGrid: transactionGrid(raw.tx, 20),
			}

			// TODO: could consider updating the cache here.
			socket.send(JSON.stringify(fullBlock))
		} catch (error) {
			console.error(`Failed to fetch block ${hash}:`, error)
			// Note: In practice, this should never happen since ZMQ fires after
			// the block is fully connected. But if it does, the client will
			// get the block on the next REST poll cycle.
		}
	}

	blockStream.on('block', sendBlock)
	socket.on('close', () => blockStream.off('block', sendBlock))
}

// Long running task to keep the cache primed
const CACHE_LOADER_INTERVAL = 1000 * 30 // 30 seconds
async function cacheLoader() {
	await setTimeout(5000)
	while (true) {
		await list(BLOCK_CACHE_DEPTH).catch(() => {})
		await getLatestBlocks(BLOCK_STATS_CACHE_DEPTH).catch(() => {})
		await setTimeout(CACHE_LOADER_INTERVAL)
	}
}
// Fire immediately and then every minute
cacheLoader().catch(() => {})
