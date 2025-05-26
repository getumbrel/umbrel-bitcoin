import fp from 'fastify-plugin'
import type {FastifyInstance} from 'fastify'

import * as bitcoind from './modules/bitcoind/bitcoind.js'
import * as peers from './modules/peers/peers.js'
import * as blocks from './modules/blocks/blocks.js'
import * as sync from './modules/sync/sync.js'
import * as stats from './modules/stats/stats.js'

// Fastify turns any uncaught error inside these handlers
// into a 500 Internal Server Error response via its default error handler.
export default fp(async (app: FastifyInstance) => {
	const BASE = '/api'

	// bitcoind manager routes
	const bitcoindBase = `${BASE}/bitcoind`

	app.get(`${bitcoindBase}/version`, bitcoind.version)
	app.get(`${bitcoindBase}/status`, bitcoind.status)
	app.post(`${bitcoindBase}/start`, bitcoind.start)
	app.post(`${bitcoindBase}/stop`, bitcoind.stop)
	app.post(`${bitcoindBase}/restart`, bitcoind.restart)

	// rpc routes
	const rpcBase = `${BASE}/rpc`

	app.get(`${rpcBase}/sync`, sync.syncStatus)

	app.get(`${rpcBase}/stats`, stats.summary)

	app.get(`${rpcBase}/peers/info`, peers.peerInfo)
	app.get(`${rpcBase}/peers/summary`, peers.peerSummary)

	app.get<{Querystring: {limit?: number}}>(`${rpcBase}/blocks`, (req) => blocks.list(req.query.limit))
	app.get<{Querystring: {limit?: number}}>(`${rpcBase}/blocks/rewards`, (req) => blocks.rewards(req.query.limit))
	app.get<{Querystring: {limit?: number}}>(`${rpcBase}/blocks/size`, (req) => blocks.blockSizes(req.query.limit))
	app.get<{Querystring: {limit?: number}}>(`${rpcBase}/blocks/fees`, (req) => blocks.feeRates(req.query.limit))

	// websocket routes
	// Note: Fastify-Websocket plugin must already be registered via app.register(fastifyWs)
	const wsBase = `${BASE}/ws`

	app.get(`${wsBase}/blocks`, {websocket: true}, blocks.wsStream)
})
