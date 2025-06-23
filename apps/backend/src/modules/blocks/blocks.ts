import {setTimeout} from 'timers/promises'

import type WebSocket from 'ws'

import {rpcClient} from '../bitcoind/rpc-client.js'
import {blockStream} from './zmq-subscriber.js'
import {getFeeTiers} from './fee-tiers.js'

import type {BlocksResponse, BlockReward, BlockSizeSample, FeeRatePoint, BlockFeeTiers, RawBlock} from '#types'

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

// Get block stats for height
// caches the CACHE_DEPTH most recent blocks
const CACHE_DEPTH = 200
const blockStatsCache = new Map<number, BlockStatsLite>()
async function getBlockStats(height: number) {
	// Check if we have a cached value and return early if so
	const cached = blockStatsCache.get(height)
	if (cached) return cached

	// If not, fetch the block stats over RPC and cache the result
	const blockStats = await rpcClient.command<BlockStatsLite>('getblockstats', height)
	blockStatsCache.set(height, blockStats)

	// If we've exceeded the cache depth, delete the oldest entries
	if (blockStatsCache.size > CACHE_DEPTH) {
		const keys = Array.from(blockStatsCache.keys())
		const sortedKeys = keys.sort((a, b) => a - b)
		const keysToDelete = sortedKeys.slice(0, blockStatsCache.size - CACHE_DEPTH)
		keysToDelete.forEach((key) => blockStatsCache.delete(key))
	}

	return blockStats
}

// Long running task to keep the cache primed
const CACHE_LOADER_INTERVAL = 1000 * 60 // 1 minute
async function cacheLoader() {
	while (true) {
		await getBlockStats(CACHE_DEPTH).catch(() => {})
		await setTimeout(CACHE_LOADER_INTERVAL)
	}
}
// Fire immediately and then every minute
cacheLoader().catch(() => {})

// Get stats for the latest N blocks
async function getLatestBlocks(limit: number) {
	// Get the tip height
	const tip = await rpcClient.command<number>('getblockcount')

	// Loop backwards over most recent n blocks from tip
	const blocks = []
	for (let i = 0; i < limit; i++) {
		const height = tip - i
		if (height < 0) break
		blocks.push(await getBlockStats(height))
	}

	// Reverse the blocks to get them in chronological order
	blocks.reverse()

	return blocks
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

// Latest N block summaries
export async function list(limit = 20): Promise<BlocksResponse> {
	const stats = await getLatestBlocks(limit)

	const blocks = stats.map((s) => {
		return {
			height: s.height,
			time: s.time,
			hash: s.blockhash,
			txs: s.txs,
			size: s.total_size,
		}
	})

	return {blocks}
}

// WebSocket push for new blocks
export function wsStream(socket: WebSocket) {
	const send = (b: unknown) => socket.send(JSON.stringify(b))
	blockStream.on('block', send)
	socket.on('close', () => blockStream.off('block', send))
}

// Get fee tiers for a specific block
export async function feeTiers(blockHash?: string): Promise<BlockFeeTiers> {
	// If no hash provided, get the latest block
	if (!blockHash) {
		const tipHeight = await rpcClient.command<number>('getblockcount')
		blockHash = await rpcClient.command<string>('getblockhash', tipHeight)
	}

	// Get block with transaction details (verbosity 2)
	const block: RawBlock = await rpcClient.command('getblock', blockHash, 2)

	// Calculate fee tiers using the external function
	const tiers = getFeeTiers(block.tx, block.weight)

	return {
		blockHash: block.hash,
		height: block.height,
		tiers,
	}
}
