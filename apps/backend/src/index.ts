import Fastify from 'fastify'
import fse from 'fs-extra'

import {BitcoindManager} from './bitcoind.js'
import {APP_STATE_DIR, BITCOIN_DIR} from './paths.js'

// Ensure that the required data directories exist before starting bitcoind or the API server
await Promise.all([fse.ensureDir(BITCOIN_DIR), fse.ensureDir(APP_STATE_DIR)])

// TODO: we probably want to wait for app.ready() before starting bitcoind if we need to handle config generation first and don't want to restart bitcoind after
const bitcoind = new BitcoindManager()
bitcoind.start()

const app = Fastify({logger: true})

// Routes
app.get('/api', () => ({message: 'Hello from the Bitcoin Node backend'}))

app.get('/api/bitcoind/status', () => bitcoind.status())

app.post('/api/bitcoind/start', async () => {
	if (bitcoind.status().running) {
		return {running: true, pid: bitcoind.status().pid, message: 'already running'}
	}
	bitcoind.start()
	return {running: true, pid: bitcoind.status().pid, message: 'started'}
})

app.post('/api/bitcoind/stop', async () => {
	if (!bitcoind.status().running) {
		return {running: false, message: 'already stopped'}
	}
	await bitcoind.stop()
	return {running: false, message: 'stopped'}
})

app.post('/api/bitcoind/restart', async () => {
	await bitcoind.restart()
	return {...bitcoind.status(), message: 'restarted'}
})

// Start the server
app
	.listen({port: 3000, host: '0.0.0.0'})
	.then((address) => console.log(`₿itcoin Node backend is running at ${address}`))
	.catch((error) => {
		app.log.error(`Failed to start server: ${error}`)
		process.exit(1)
	})

// Log unhandled rejections
process.on('unhandledRejection', (reason) => app.log.error({reason}, 'Unhandled rejection'))

// Graceful shutdown of bitcoind
// TODO: fix for dev: [tsx] Previous process hasn't exited yet. Force killing...
process.on('SIGINT', () => bitcoind.stop().then(() => process.exit(0)))
process.on('SIGTERM', () => bitcoind.stop().then(() => process.exit(0)))
