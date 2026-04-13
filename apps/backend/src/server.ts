import path from 'node:path'
import {fileURLToPath} from 'node:url'
import Fastify from 'fastify'
import fastifyWs from '@fastify/websocket'
import fastifyStatic from '@fastify/static'
import helmet from '@fastify/helmet'

import {bootBitcoind, bitcoind} from './modules/bitcoind/bitcoind.js'
import {ensureDirs} from './lib/paths.js'
import routes from './routes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Ensure that the required data directories exist before we start
await ensureDirs()

// Start bitcoind without blocking server start
bootBitcoind().catch((error) => {
	bitcoind.setLastError(error as Error) // record for /status
	app.log.error(error, 'Bitcoind bootstrap failed.')
})

// Create the HTTP server and register the routes
const app = Fastify({logger: true})

// CSP
await app.register(helmet, {
	contentSecurityPolicy: {
		// We keep Helmet’s defaults and only add what's missing
		directives: {
			// Upgrade-insecure-requests is ignored on HTTP, so we omit it entirely
			upgradeInsecureRequests: null,
		},
	},
})

await app.register(fastifyWs)

// Detect dead WebSocket connections. Without this, a client whose network
// drops silently (no close frame) leaves a phantom connection that leaks
// listeners forever — especially on the /ws/bitcoind/exit endpoint which
// rarely sends data and would never trigger TCP failure detection.
const HEARTBEAT_MS = 30_000
const aliveClients = new WeakSet<import('ws').WebSocket>()

app.websocketServer.on('connection', (ws) => {
	aliveClients.add(ws)
	ws.on('pong', () => aliveClients.add(ws))
})

setInterval(() => {
	for (const ws of app.websocketServer.clients) {
		if (!aliveClients.has(ws)) {
			ws.terminate()
			continue
		}
		aliveClients.delete(ws)
		ws.ping()
	}
}, HEARTBEAT_MS)

// serve ui static files from dist/public in production
app.register(fastifyStatic, {
	root: path.join(__dirname, 'public'),
	wildcard: false, // do not serve index.html for all routes
})

await app.register(routes)

// SPA fallback is last to serve the UI routes
app.get('/*', (_, reply) => reply.sendFile('index.html'))

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
