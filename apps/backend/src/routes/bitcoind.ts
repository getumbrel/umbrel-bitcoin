// Routes that query BitcoindManager directly
// Fastify turns any uncaught error inside these handlers
// into a 500 Internal Server Error response via its default error handler.

import fp from 'fastify-plugin'
import type {FastifyInstance} from 'fastify'

import type {BitcoindVersion, BitcoindStatus, BitcoindLifecycleResponse} from '@umbrel-bitcoin/shared-types'

import {bitcoind} from '../services/boot-bitcoind.js'

export default fp(async (app: FastifyInstance) => {
	const BASE = '/api/bitcoind'

	app.get<{Reply: BitcoindVersion}>(`${BASE}/version`, () => bitcoind.getVersionInfo())

	app.get<{Reply: BitcoindStatus}>(`${BASE}/status`, () => bitcoind.status())

	app.post<{Reply: BitcoindLifecycleResponse}>(`${BASE}/start`, () => {
		if (bitcoind.status().running) return {...bitcoind.status(), result: 'no_op'}

		bitcoind.start()
		return {...bitcoind.status(), result: 'started'}
	})

	app.post<{Reply: BitcoindLifecycleResponse}>(`${BASE}/stop`, async () => {
		if (!bitcoind.status().running) return {...bitcoind.status(), result: 'no_op'}

		await bitcoind.stop()
		return {...bitcoind.status(), result: 'stopped'}
	})

	app.post<{Reply: BitcoindLifecycleResponse}>(`${BASE}/restart`, async () => {
		await bitcoind.restart()
		return {...bitcoind.status(), result: 'started'}
	})
})
