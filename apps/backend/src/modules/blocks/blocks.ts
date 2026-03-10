// Block cache and data pipeline.
//
// A single in-memory cache of up to 200 Block objects serves all consumers
// (REST endpoint, WebSocket, insights charts, home page 3D blocks).
//
// Two fetch strategies populate the same cache:
//   - getblockstats (lightweight) — used during prime for bulk loading 200 blocks.
//     Returns precomputed stats (fees, size, weight, fee percentiles) without full
//     transaction data. These blocks have transactionGrid: [].
//   - getblock verbosity 2 (heavy) — used for ZMQ new-block events (1 at a time)
//     and cache misses from the home page (needs transactionGrid for cube faces).
//
// Cache population strategy:
//   Synced:    ZMQ hashblock events → fetch by hash (verbosity 2) → cache + broadcast.
//              Frontend receives real-time updates via a single global WebSocket.
//   IBD:      ZMQ is silent (Core suppresses notifications during IBD). Frontend does not
//              fetch blocks during IBD (home page shows sync progress via useSyncStatus).
//   Catch-up: ZMQ fires rapidly while blocks < headers. We skip these events. Once
//              blocks === headers, normal ZMQ handling resumes.
//
// On startup/restart we prime the cache (5 blocks if not synced, 200 if synced).
// The first ZMQ event that sees blocks === headers triggers a background 200-block
// prime so the insights page data is ready.
// On bitcoind stop (e.g. network switch), the cache is cleared to avoid serving
// stale blocks from the old chain.

import {setTimeout} from 'timers/promises'
import {EventEmitter} from 'node:events'

import type WebSocket from 'ws'
import PQueue from 'p-queue'

import {rpcClient} from '../bitcoind/rpc-client.js'
import {bitcoind} from '../bitcoind/bitcoind.js'
import {blockStream} from './zmq-subscriber.js'

import type {Block, RawBlock, RawTransaction} from '#types'

const rpcQueue = new PQueue({concurrency: 10})

// --- Pure helpers ---

function computeSubsidy(height: number): number {
	const halvings = Math.floor(height / 210_000)
	if (halvings >= 64) return 0
	return Math.floor(50e8 / 2 ** halvings)
}

function computeFeeRatePercentiles(txs: RawTransaction[]): {p10: number; p50: number; p90: number} {
	const feeRates = txs
		.filter((tx) => tx.fee != null)
		.map((tx) => Math.round((tx.fee! * 1e8) / tx.vsize))
		.sort((a, b) => a - b)

	if (feeRates.length === 0) return {p10: 0, p50: 0, p90: 0}

	const pick = (p: number) => feeRates[Math.min(Math.floor((p / 100) * feeRates.length), feeRates.length - 1)]
	return {p10: pick(10), p50: pick(50), p90: pick(90)}
}

function transactionGrid(transactions: RawTransaction[], gridSize: number) {
	const TOTAL_BLOCK_SIZE = 4_000_000

	const squareSizes = Array.from({length: gridSize}, (_, i) => i + 1).map((size) => ({
		size,
		totalWeight: 0,
		numberOfBlocks: 0,
	}))

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

	for (const chunk of squareSizes) {
		const chunkPercentageOfGrid = Math.pow(chunk.size / gridSize, 2)
		const chunkPercentageOfBlock = chunk.totalWeight / TOTAL_BLOCK_SIZE
		const numberOfBlocks = Math.round(chunkPercentageOfBlock / chunkPercentageOfGrid)
		chunk.numberOfBlocks = numberOfBlocks
	}

	return squareSizes
		.filter((chunk) => chunk.numberOfBlocks > 0)
		.map(({size, numberOfBlocks}) => ({size, numberOfBlocks}))
}

// --- Block constructors ---

// Partial type of bitcoind's getblockstats RPC
type BlockStats = {
	height: number
	time: number
	blockhash: string
	total_size: number
	total_weight: number
	txs: number
	subsidy: number
	totalfee: number
	feerate_percentiles: [number, number, number, number, number]
}

// Lightweight: from getblockstats (no full tx data, no transactionGrid)
function statsToBlock(stats: BlockStats): Block {
	const [p10, , p50, , p90] = stats.feerate_percentiles
	return {
		hash: stats.blockhash,
		height: stats.height,
		time: stats.time,
		size: stats.total_size,
		weight: stats.total_weight,
		txCount: stats.txs,
		subsidySat: stats.subsidy,
		feesSat: stats.totalfee,
		feeRates: {p10, p50, p90},
		transactionGrid: [],
	}
}

// Full: from getblock verbosity 2 (includes transactionGrid for cube faces)
function rawToBlock(raw: RawBlock): Block {
	const feesSat = Math.round(
		raw.tx.reduce((sum: number, tx) => sum + (tx.fee ?? 0), 0) * 1e8,
	)

	return {
		hash: raw.hash,
		height: raw.height,
		time: raw.time,
		size: raw.size,
		weight: raw.weight,
		txCount: raw.nTx,
		subsidySat: computeSubsidy(raw.height),
		feesSat,
		feeRates: computeFeeRatePercentiles(raw.tx),
		transactionGrid: transactionGrid(raw.tx, 20),
	}
}

// --- Single unified cache ---

const CACHE_DEPTH = 200
const blockCache = new Map<number, Block>()

function evictOldEntries() {
	if (blockCache.size <= CACHE_DEPTH) return
	const sortedKeys = Array.from(blockCache.keys()).sort((a, b) => a - b)
	const keysToDelete = sortedKeys.slice(0, blockCache.size - CACHE_DEPTH)
	keysToDelete.forEach((key) => blockCache.delete(key))
}

// Lightweight fetch via getblockstats — used for bulk priming.
// Does NOT overwrite a full block (with transactionGrid) if one is already cached.
async function getBlockLight(height: number): Promise<Block> {
	const cached = blockCache.get(height)
	if (cached) return cached

	const stats = await rpcClient.command<BlockStats>('getblockstats', height)
	const block = statsToBlock(stats)

	blockCache.set(height, block)
	evictOldEntries()

	return block
}

// Full fetch via getblock verbosity 2 — used for ZMQ events and home page blocks.
// Always overwrites the cache entry (upgrades light → full).
async function getBlockFull(height: number): Promise<Block> {
	const cached = blockCache.get(height)
	if (cached && cached.transactionGrid.length > 0) return cached

	console.log(`[blocks] fetching full block ${height}`)
	const blockHash = await rpcClient.command<string>('getblockhash', height)
	const raw = await rpcClient.command<RawBlock>('getblock', blockHash, 2)
	const block = rawToBlock(raw)

	blockCache.set(height, block)
	evictOldEntries()

	return block
}

// --- Frontend-facing reads ---

export async function list(limit = 200): Promise<Block[]> {
	const tipHeight = await rpcClient.command<number>('getblockcount')
	const count = Math.min(limit, tipHeight + 1)

	// Use lightweight fetch for bulk reads (insights charts).
	// Home page requests (limit ≤ 5) use full fetch for transactionGrid.
	const fetchFn = limit <= 5 ? getBlockFull : getBlockLight

	const blocks = (await Promise.all(
		Array.from({length: count}, (_, i) =>
			rpcQueue.add(() => fetchFn(tipHeight - i)),
		),
	)) as Block[]

	// Return in chronological order (oldest first)
	return blocks.reverse()
}

// --- ZMQ-driven cache updates ---

const newBlockEmitter = new EventEmitter()

let processing = false
let fullPrimeComplete = false

// Bitcoin Core's ZMQ block notifiers are silent during IBD, so this only fires
// when IBD is complete. During post-IBD catch-up (blocks < headers), we skip
// until the node reaches the tip. Once at the tip, we fetch the new block by
// hash, cache it, and broadcast to WebSocket clients.
blockStream.on('block', async (hash: string) => {
	if (processing) return
	processing = true
	try {
		const {blocks, headers} = await rpcClient.command<{blocks: number; headers: number}>('getblockchaininfo')
		if (blocks !== headers) return // still catching up, skip

		// Fetch full block (verbosity 2) — just one block, and we need transactionGrid
		const raw = await rpcClient.command<RawBlock>('getblock', hash, 2)
		const block = rawToBlock(raw)
		blockCache.set(block.height, block)
		evictOldEntries()

		// Broadcast to WebSocket clients
		newBlockEmitter.emit('block', block)

		// On first at-tip event after startup/IBD, prime the full cache in background
		// so the insights page has 200 blocks ready
		if (!fullPrimeComplete) {
			fullPrimeComplete = true
			console.log('[blocks] at tip, priming full cache in background')
			list(CACHE_DEPTH).catch((err) => console.error('[blocks] background prime error:', err))
		}
	} catch (err) {
		console.error('[blocks] ZMQ handler error:', err)
	} finally {
		processing = false
	}
})

// --- WebSocket (subscribes to processed blocks, no RPC calls) ---

export function wsStream(socket: WebSocket) {
	const send = (block: Block) => {
		try {
			socket.send(JSON.stringify(block))
		} catch {
			// Socket may have closed between emit and send
		}
	}
	newBlockEmitter.on('block', send)
	socket.on('close', () => newBlockEmitter.off('block', send))
}

// --- Cache prime ---
// Prime the cache so frontend requests are fast once the node is synced.
// If already synced, prime the full 200 blocks via getblockstats (lightweight).
// If in IBD/catch-up, prime just 5 blocks — the full prime happens when the
// first ZMQ at-tip event arrives.

let priming = false

async function prime() {
	if (priming) return
	priming = true
	try {
		await setTimeout(5000) // wait for bitcoind to be ready
		const {blocks, headers} = await rpcClient.command<{blocks: number; headers: number}>('getblockchaininfo')
		const atTip = blocks === headers
		if (atTip) fullPrimeComplete = true
		console.log(`[blocks] prime: ${atTip ? CACHE_DEPTH : 5} blocks (${atTip ? 'synced' : 'not synced'})`)
		await list(atTip ? CACHE_DEPTH : 5)
	} finally {
		priming = false
	}
}

function reset() {
	blockCache.clear()
	fullPrimeComplete = false
	processing = false
	priming = false
}

// --- Bitcoind lifecycle ---
// When bitcoind restarts (e.g. user switches network), the in-memory cache
// would serve stale blocks from the old chain. Clear it on stop, re-prime on start.

bitcoind.events.on('stop', () => {
	console.log('[blocks] bitcoind stopped, clearing cache')
	reset()
})

bitcoind.events.on('start', () => {
	console.log('[blocks] bitcoind started, priming cache')
	prime().catch((err) => console.error('[blocks] prime error:', err))
})

prime().catch((err) => console.error('[blocks] init error:', err))
