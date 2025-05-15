import fp from 'fastify-plugin'
import type {FastifyInstance} from 'fastify'
import type WebSocket from 'ws'

import type {
	BitcoindVersion,
	BitcoindStatus,
	BitcoindLifecycleResponse,
	BlocksResponse,
	PeerTally,
	RawBlock,
	BlockSummary,
} from '@umbrel-bitcoin/shared-types'

import {bitcoind} from './modules/boot-bitcoind.js'
import {rpcClient} from './modules/rpc-client.js'
import {blockStream} from './modules/zmq-blocks.js'

// Fastify turns any uncaught error inside these handlers
// into a 500 Internal Server Error response via its default error handler.
export default fp(async (app: FastifyInstance) => {
	const BASE = '/api'

	// bitcoind manager routes
	const bitcoindBase = `${BASE}/bitcoind`

	app.get<{Reply: BitcoindVersion}>(`${bitcoindBase}/version`, () => bitcoind.getVersionInfo())

	app.get<{Reply: BitcoindStatus}>(`${bitcoindBase}/status`, () => bitcoind.status())

	app.post<{Reply: BitcoindLifecycleResponse}>(`${bitcoindBase}/start`, () => {
		if (bitcoind.status().running) return {...bitcoind.status(), result: 'no_op'}

		bitcoind.start()
		return {...bitcoind.status(), result: 'started'}
	})

	app.post<{Reply: BitcoindLifecycleResponse}>(`${bitcoindBase}/stop`, async () => {
		if (!bitcoind.status().running) return {...bitcoind.status(), result: 'no_op'}

		await bitcoind.stop()
		return {...bitcoind.status(), result: 'stopped'}
	})

	app.post<{Reply: BitcoindLifecycleResponse}>(`${bitcoindBase}/restart`, async () => {
		await bitcoind.restart()
		return {...bitcoind.status(), result: 'started'}
	})

	// rpc routes
	const rpcBase = `${BASE}/rpc`

	app.get(`${rpcBase}/sync`, async () => {
		const info = await rpcClient.command('getblockchaininfo')

		return {
			syncProgress: info.verificationprogress,
			isInitialBlockDownload: info.initialblockdownload,
			blockHeight: info.blocks,
			validatedHeaderHeight: info.headers,
		}
	})

	app.get<{Reply: PeerTally}>(`${rpcBase}/peers`, async () => {
		const peers = await rpcClient.command('getpeerinfo')

		// network can be ipv4, ipv6, onion, i2p, cjdns, not_publicly_routable
		const tally: PeerTally = {total: peers.length, byNetwork: {}}

		for (const p of peers) {
			const bucket = (tally.byNetwork[p.network] ??= {inbound: 0, outbound: 0})

			if (p.inbound) bucket.inbound++
			else bucket.outbound++
		}

		return tally
	})

	// route for blocks
	app.get<{
		Querystring: {limit?: string}
		Reply: BlocksResponse
	}>(`${rpcBase}/blocks`, async (request) => {
		// default to 20 blocks
		const ask = Number(request.query.limit ?? 20)

		// clamp to 1 … 100 for sanity
		const limit = Math.min(Math.max(ask, 1), 100)

		// get the current tip height to use as the starting point
		const tipHeight = await rpcClient.command<number>('getblockcount')

		// get all the hashes we need
		const hashCalls = Array.from({length: limit}, (_, i) => ({
			method: 'getblockhash',
			parameters: [tipHeight - i],
		}))
		const hashes: string[] = await rpcClient.command(hashCalls)

		// get each block's summary
		// verbosity 1 doesn't include full transaction info, just the txids
		const blockCalls = hashes.map((h) => ({
			method: 'getblock',
			parameters: [h, 1],
		}))
		const rawBlocks: RawBlock[] = await rpcClient.command(blockCalls)

		const blocks: BlockSummary[] = rawBlocks.map((b) => ({
			hash: b.hash,
			height: b.height,
			time: b.time,
			txs: b.nTx,
			size: b.size,
		}))

		return {blocks}
	})

	// websocket routes
	// Note: Fastify-Websocket plugin must already be registered via app.register(fastifyWs)
	app.get('/api/ws/blocks', {websocket: true}, (socket: WebSocket) => {
		const send = (b: unknown) => socket.send(JSON.stringify(b))
		blockStream.on('block', send)
		socket.on('close', () => blockStream.off('block', send))
	})
})
