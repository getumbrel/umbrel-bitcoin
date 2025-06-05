import fp from 'fastify-plugin'
import type {FastifyInstance} from 'fastify'

import * as bitcoind from './modules/bitcoind/bitcoind.js'
import * as peers from './modules/peers/peers.js'
import * as blocks from './modules/blocks/blocks.js'
import * as sync from './modules/sync/sync.js'
import * as stats from './modules/stats/stats.js'
import * as config from './modules/config/config.js'

import {settingsSchema} from '@umbrel-bitcoin/settings'

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
	app.get(`${rpcBase}/peers/count`, peers.peerCount)
	app.get(`${rpcBase}/peers/locations`, peers.peerLocations)

	app.get<{Querystring: {limit?: number}}>(`${rpcBase}/blocks`, (req) => blocks.list(req.query.limit))
	app.get<{Querystring: {limit?: number}}>(`${rpcBase}/blocks/rewards`, (req) => blocks.rewards(req.query.limit))
	app.get<{Querystring: {limit?: number}}>(`${rpcBase}/blocks/size`, (req) => blocks.blockSizes(req.query.limit))
	app.get<{Querystring: {limit?: number}}>(`${rpcBase}/blocks/fees`, (req) => blocks.feeRates(req.query.limit))

	// config routes
	const configBase = `${BASE}/config`

	app.get(`${configBase}/settings`, config.getSettings)
	app.patch(`${configBase}/settings`, async (req) => {
		// We create a new Zod schema whose keys are all optional
		// and validate+coerce the incoming JSON against it.
		// This allows us to patch only the fields we want to change.
		// This will throw ZodError, which Fastify converts to 400 JSON automatically.
		const settingsChanges = settingsSchema.partial().parse(req.body)

		return config.updateSettings(settingsChanges)
	})

	// websocket routes
	// Note: Fastify-Websocket plugin must already be registered via app.register(fastifyWs)
	const wsBase = `${BASE}/ws`

	app.get(`${wsBase}/blocks`, {websocket: true}, blocks.wsStream)
})
