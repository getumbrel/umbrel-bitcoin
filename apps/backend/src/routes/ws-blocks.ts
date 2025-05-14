import fp from 'fastify-plugin'
import type {FastifyInstance} from 'fastify'
import type WebSocket from 'ws'

import {blockStream} from '../services/zmq-blocks.js'

export default fp(async (f: FastifyInstance) => {
	// `f` is the Fastify instance injected by fastify-plugin

	// Note: Fastify-Websocket plugin must already be registered via app.register(fastifyWs)
	f.get('/api/ws/blocks', {websocket: true}, (socket: WebSocket) => {
		const send = (b: unknown) => socket.send(JSON.stringify(b))
		blockStream.on('block', send)
		socket.on('close', () => blockStream.off('block', send))
	})
})
