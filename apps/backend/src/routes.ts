import fp from 'fastify-plugin'
import type {FastifyInstance} from 'fastify'

import * as bitcoind from './modules/bitcoind/bitcoind.js'
import * as peers from './modules/peers/peers.js'
import * as blocks from './modules/blocks/blocks.js'

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
	app.get(`${rpcBase}/sync`, blocks.syncStatus)
	app.get(`${rpcBase}/peers`, peers.tally)
	app.get<{Querystring: {limit?: string}}>(`${rpcBase}/blocks`, (req) => blocks.list(req.query.limit))

	// websocket routes
	// Note: Fastify-Websocket plugin must already be registered via app.register(fastifyWs)
	const wsBase = `${BASE}/ws`
	app.get(`${wsBase}/blocks`, {websocket: true}, blocks.wsStream)
})
