import fp from 'fastify-plugin'
import type {FastifyInstance} from 'fastify'

import {bitcoind} from '../services/boot-bitcoind.js'

export default fp(async (f: FastifyInstance) => {
	// `f` is the Fastify instance injected by fastify-plugin

	f.get('/api/bitcoind/status', () => bitcoind.status())

	f.post('/api/bitcoind/start', () => {
		if (bitcoind.status().running) return {...bitcoind.status(), message: 'already running'}

		bitcoind.start()
		return {...bitcoind.status(), message: 'started'}
	})

	f.post('/api/bitcoind/stop', async () => {
		if (!bitcoind.status().running) return {...bitcoind.status(), message: 'already stopped'}

		await bitcoind.stop()
		return {...bitcoind.status(), message: 'stopped'}
	})

	f.post('/api/bitcoind/restart', async () => {
		await bitcoind.restart()
		return {...bitcoind.status(), message: 'restarted'}
	})
})
