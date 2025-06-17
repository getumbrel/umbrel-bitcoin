import type WebSocket from 'ws'

import {rpcClient} from '../bitcoind/rpc-client.js'
import {blockStream} from './zmq-subscriber.js'
import {cache} from '../../lib/cache.js'

import type {
	BlocksResponse,
	BlockSummary,
	BlockReward,
	BlockSizeSample,
	FeeRatePoint,
	BlockFeeTiers,
	FeeTier,
} from '@umbrel-bitcoin/shared-types'

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
}

// Transaction from getblock verbosity 2
type RawTransaction = {
	txid: string
	fee?: number // fee in BTC (not available for coinbase)
	vsize: number
}

// Block from getblock verbosity 2
type RawBlockWithTx = {
	hash: string
	height: number
	time: number
	nTx: number
	size: number
	weight: number
	tx: RawTransaction[]
}

// Number of blocks to fetch per batch rpc.
// Individual methods then slice the response to the desired limit.
const NUM_BLOCKS_PER_BATCH = 200

// Fee tier boundaries in sat/vB
const FEE_TIERS = [
	{min: 0, max: 2},
	{min: 2, max: 5},
	{min: 5, max: 10},
	{min: 10, max: 25},
	{min: 25, max: 50},
	{min: 50, max: 100},
	{min: 100, max: 250},
	{min: 250, max: Infinity},
]

// Cached getblockstats response
const getBlockStatsBatchRPC = () =>
	cache('blockstats', 10_000, async () => {
		const tip = await rpcClient.command<number>('getblockcount')

		const calls = Array.from({length: NUM_BLOCKS_PER_BATCH}, (_, i) => ({
			method: 'getblockstats',
			parameters: [tip - i],
		}))

		return await rpcClient.command<BlockStatsLite[]>(calls)
	})

// Block rewards (subsidy + fee totals)
export async function rewards(limit = 144): Promise<BlockReward[]> {
	const stats = (await getBlockStatsBatchRPC()).slice(-limit)
	return stats.map((s) => ({
		height: s.height,
		subsidySat: s.subsidy,
		feesSat: s.totalfee,
		time: s.time,
	}))
}

// Total block sizes
export async function blockSizes(limit = 144): Promise<BlockSizeSample[]> {
	const stats = (await getBlockStatsBatchRPC()).slice(-limit)
	return stats.map((s) => ({
		height: s.height,
		sizeBytes: s.total_size,
		time: s.time,
	}))
}

// Fee-rate percentiles (p10/p50/p90)
export async function feeRates(limit = 144): Promise<FeeRatePoint[]> {
	const stats = (await getBlockStatsBatchRPC()).slice(-limit)
	return stats.map((s) => {
		const [p10, , p50, , p90] = s.feerate_percentiles ?? [0, 0, 0, 0, 0]
		return {height: s.height, p10, p50, p90, time: s.time}
	})
}

// Latest N block summaries
export async function list(limit = 20): Promise<BlocksResponse> {
	// get the current tip height to use as the starting point
	const tipHeight = await rpcClient.command<number>('getblockcount')

	// fetch hashes then summaries in batch RPC style
	const hashes: string[] = await rpcClient.command(
		Array.from({length: limit}, (_, i) => ({
			method: 'getblockhash',
			parameters: [tipHeight - i],
		})),
	)

	// get each block's summary with transaction details (verbosity 2)
	const raw: RawBlockWithTx[] = await rpcClient.command(hashes.map((h) => ({method: 'getblock', parameters: [h, 2]})))

	const blocks: BlockSummary[] = await Promise.all(
		raw.map(async (b) => {
			const summary: BlockSummary = {
				hash: b.hash,
				height: b.height,
				time: b.time,
				txs: b.nTx,
				size: b.size,
			}

			// Calculate fee tiers
			const tierCounts: Map<number, number> = new Map()

			for (const tx of b.tx) {
				// Skip coinbase transaction (no fee)
				if (!tx.fee) continue

				// Calculate fee rate in sat/vB
				const feerateSatPerVB = (tx.fee * 100_000_000) / tx.vsize

				// Find which tier this transaction belongs to
				const tierIndex = FEE_TIERS.findIndex((tier) => feerateSatPerVB >= tier.min && feerateSatPerVB < tier.max)

				if (tierIndex !== -1) {
					tierCounts.set(tierIndex, (tierCounts.get(tierIndex) || 0) + 1)
				}
			}

			// Convert to array of tiers with square sizes
			const tiers: FeeTier[] = []
			const counts = Array.from(tierCounts.values())
			const maxCount = Math.max(...counts, 1)

			for (const [tierIndex, count] of tierCounts.entries()) {
				const tier = FEE_TIERS[tierIndex]
				if (!tier) continue

				// Calculate square size (1-5) using logarithmic scaling
				const normalizedCount = count / maxCount
				const squareSize = Math.max(1, Math.ceil(normalizedCount * 5))

				tiers.push({
					minFeerate: tier.min,
					maxFeerate: tier.max,
					txCount: count,
					squareSize,
				})
			}

			// Sort tiers by fee rate for consistent ordering
			tiers.sort((a, b) => a.minFeerate - b.minFeerate)

			summary.feeTiers = tiers

			return summary
		}),
	)

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
	const block: RawBlockWithTx = await rpcClient.command('getblock', blockHash, 2)

	// Group transactions by fee tier
	const tierCounts: Map<number, number> = new Map()

	for (const tx of block.tx) {
		// Skip coinbase transaction (no fee)
		if (!tx.fee) continue

		// Calculate fee rate in sat/vB
		const feerateSatPerVB = (tx.fee * 100_000_000) / tx.vsize

		// Find which tier this transaction belongs to
		const tierIndex = FEE_TIERS.findIndex((tier) => feerateSatPerVB >= tier.min && feerateSatPerVB < tier.max)

		if (tierIndex !== -1) {
			tierCounts.set(tierIndex, (tierCounts.get(tierIndex) || 0) + 1)
		}
	}

	// Convert to array of tiers with square sizes
	const tiers: FeeTier[] = []
	const counts = Array.from(tierCounts.values())
	const maxCount = Math.max(...counts, 1)

	for (const [tierIndex, count] of tierCounts.entries()) {
		const tier = FEE_TIERS[tierIndex]
		if (!tier) continue

		// Calculate square size (1-5) using logarithmic scaling
		const normalizedCount = count / maxCount
		const squareSize = Math.max(1, Math.ceil(normalizedCount * 5))

		tiers.push({
			minFeerate: tier.min,
			maxFeerate: tier.max,
			txCount: count,
			squareSize,
		})
	}

	// Sort tiers by fee rate for consistent ordering
	tiers.sort((a, b) => a.minFeerate - b.minFeerate)

	return {
		blockHash: block.hash,
		height: block.height,
		tiers,
	}
}
