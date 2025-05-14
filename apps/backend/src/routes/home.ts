// Routes for the Home page
// Fastify turns any uncaught error inside these handlers
// into a 500 Internal Server Error response via its default error handler.

import fp from 'fastify-plugin'
import type {FastifyInstance} from 'fastify'

import type {BlocksResponse, BlockSummary, PeerTally, RawBlock, SummaryResponse} from '@umbrel-bitcoin/shared-types'

import {rpcClient} from '../services/rpc-client.js'

const BASE = '/api/home'

export default fp(async (app: FastifyInstance) => {
	// route for sync-related data
	app.get(`${BASE}/sync`, async () => {
		const info = await rpcClient.command('getblockchaininfo')

		return {
			syncProgress: info.verificationprogress,
			isInitialBlockDownload: info.initialblockdownload,
			blockHeight: info.blocks,
			validatedHeaderHeight: info.headers,
		}
	})

	// route for peers data
	app.get<{Reply: PeerTally}>(`${BASE}/peers`, async () => {
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
	}>(`${BASE}/blocks`, async (request) => {
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

	// TODO: eventually remove this POC
	app.get('/api/bitcoind/summary', async (): Promise<SummaryResponse> => {
		const batch = [
			{method: 'getnetworkinfo', parameters: []},
			{method: 'getblockchaininfo', parameters: []},
			{method: 'getpeerinfo', parameters: []},
		]

		const [networkInfo, blockchainInfo, peerInfo] = await rpcClient.command(batch)

		return {networkInfo, blockchainInfo, peerInfo}
	})
})
