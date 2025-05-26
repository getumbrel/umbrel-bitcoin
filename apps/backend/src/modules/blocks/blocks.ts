import type WebSocket from 'ws'
import type {
	BlocksResponse,
	RawBlock,
	BlockSummary,
	BlockReward,
	BlockSizeSample,
	FeeRatePoint,
} from '@umbrel-bitcoin/shared-types'

import {rpcClient} from '../bitcoind/rpc-client.js'
import {blockStream} from './zmq-subscriber.js'

type BlockStatsLite = {
	height: number
	subsidy: number // sat
	totalfee: number // sat
	total_weight: number // bytes
	total_size: number // bytes
	avgfeerate: number // sat/vB
	feerate_percentiles: number[]
	time: number // unix timestamp
}

// We cache the block stats so multiple endpoints can share
let cache: {data: BlockStatsLite[]; expiry: number} | null = null

async function getBlockStatsBatch(limit: number): Promise<BlockStatsLite[]> {
	if (cache && cache.expiry > Date.now() && cache.data.length >= limit) return cache.data.slice(-limit)

	const tip = await rpcClient.command<number>('getblockcount')
	const calls = Array.from({length: limit}, (_, i) => ({
		method: 'getblockstats',
		parameters: [tip - i],
	}))

	// oldest → newest
	const stats = (await rpcClient.command<BlockStatsLite[]>(calls)).reverse()

	// 1-min TTL (reduce this)
	cache = {data: stats, expiry: Date.now() + 60_000}

	return stats
}

// Block rewards
export async function rewards(limit = 144): Promise<BlockReward[]> {
	const stats = await getBlockStatsBatch(limit)

	return stats.map((s: BlockStatsLite) => ({
		height: s.height,
		subsidySat: s.subsidy,
		feesSat: s.totalfee,
		time: s.time,
	}))
}

// Block size
export async function blockSizes(limit = 144): Promise<BlockSizeSample[]> {
	const stats = await getBlockStatsBatch(limit)

	return stats.map((s) => ({
		height: s.height,
		sizeBytes: s.total_size,
		time: s.time,
	}))
}

// Fee rates
export async function feeRates(limit = 144): Promise<FeeRatePoint[]> {
	const stats = await getBlockStatsBatch(limit)

	// TODO: remove unused percentiles
	return stats.map((s) => {
		const [p10, , p50, , p90] = s.feerate_percentiles ?? [0, 0, 0, 0, 0]
		return {
			height: s.height,
			p10,
			p50,
			p90,
			time: s.time,
		}
	})
}

// Get the latest N block summaries
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

	// get each block's summary
	// verbosity 1 doesn't include full transaction info, just the txids
	const raw: RawBlock[] = await rpcClient.command(hashes.map((h) => ({method: 'getblock', parameters: [h, 1]})))

	const blocks: BlockSummary[] = raw.map((b) => ({
		hash: b.hash,
		height: b.height,
		time: b.time,
		txs: b.nTx,
		size: b.size,
	}))

	return {blocks}
}

// Attach a websocket and stream new block summaries
export function wsStream(socket: WebSocket) {
	const send = (b: unknown) => socket.send(JSON.stringify(b))
	blockStream.on('block', send)
	socket.on('close', () => blockStream.off('block', send))
}
