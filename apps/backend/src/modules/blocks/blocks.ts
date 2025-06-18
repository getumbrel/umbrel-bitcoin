import type WebSocket from 'ws'

import {rpcClient} from '../bitcoind/rpc-client.js'
import {blockStream} from './zmq-subscriber.js'
import {cache} from '../../lib/cache.js'
import {getFeeTiers} from './fee-tiers.js'

import type {
	BlocksResponse,
	BlockSummary,
	BlockReward,
	BlockSizeSample,
	FeeRatePoint,
	BlockFeeTiers,
	RawBlock,
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



// Number of blocks to fetch per batch rpc.
// Individual methods then slice the response to the desired limit.
const NUM_BLOCKS_PER_BATCH = 200

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
	const raw: RawBlock[] = await rpcClient.command(hashes.map((h) => ({method: 'getblock', parameters: [h, 2]})))

	const blocks: BlockSummary[] = await Promise.all(
		raw.map(async (b) => {
			const summary: BlockSummary = {
				hash: b.hash,
				height: b.height,
				time: b.time,
				txs: b.nTx,
				size: b.size,
			}

			// Get fee tiers using the external function
			summary.feeTiers = getFeeTiers(b.tx, b.weight)

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
	const block: RawBlock = await rpcClient.command('getblock', blockHash, 2)

	// Calculate fee tiers using the external function
	const tiers = getFeeTiers(block.tx, block.weight)

	return {
		blockHash: block.hash,
		height: block.height,
		tiers,
	}
}
