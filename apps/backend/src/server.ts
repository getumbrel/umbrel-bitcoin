import Fastify from 'fastify'
import fastifyWs from '@fastify/websocket'

import {bootBitcoind, bitcoind} from './services/boot-bitcoind.js'
import {ensureDirs} from './lib/paths.js'
import routes from './routes.js'

// Ensure that the required data directories exist before we start
await ensureDirs()

// Start bitcoind without blocking server start
bootBitcoind().catch((err) => {
	bitcoind.setLastError(err as Error) // record for /status
	app.log.error('Bitcoind bootstrap failed:', err)
})

// Create the HTTP server and register the routes
const app = Fastify({logger: true})
await app.register(fastifyWs)
await app.register(routes)

// Start the server
app
	.listen({port: 3000, host: '0.0.0.0'})
	.then((address) => app.log.info(`₿itcoin Node backend is running at ${address}`))
	.catch((error) => {
		app.log.error(`Failed to start server: ${error}`)
		process.exit(1)
	})

// Log unhandled rejections
process.on('unhandledRejection', (reason) => app.log.error({reason}, 'Unhandled rejection'))

// Graceful shutdown of bitcoind
// TODO: fix for dev: [tsx] Previous process hasn't exited yet. Force killing...
const shutdown = () => bitcoind.stop().then(() => process.exit(0))
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
