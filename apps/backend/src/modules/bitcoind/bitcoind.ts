// Public façade for the singleton BitcoindManager.
// Gives routes a one-liner API: `app.post('/restart', bitcoind.restart)`.

import type {BitcoindVersion, BitcoindStatus, BitcoindLifecycleResponse, ExitInfo} from '@umbrel-bitcoin/shared-types'
import type WebSocket from 'ws'

// This is the BitcoindManager instance created in boot.js
import {bitcoind} from './boot.js'

export const version = (): BitcoindVersion => bitcoind.versionInfo

export const status = (): BitcoindStatus => bitcoind.status()

export const start = (): BitcoindLifecycleResponse => {
	if (status().running) return {...status(), result: 'no_op'}
	bitcoind.start()
	return {...status(), result: 'started'}
}

export const stop = async (): Promise<BitcoindLifecycleResponse> => {
	if (!status().running) return {...status(), result: 'no_op'}
	await bitcoind.stop()
	return {...status(), result: 'stopped'}
}

export const restart = async (): Promise<BitcoindLifecycleResponse> => {
	await bitcoind.restart()
	return {...status(), result: 'started'}
}

export const exitInfo = (): ExitInfo | null => bitcoind.exitInfo

export const events = () => bitcoind.events

// WebSocket stream for bitcoind exit events
export function wsExitStream(socket: WebSocket) {
	const send = (payload: unknown) => socket.send(JSON.stringify(payload))

	// Sends a snapshot immediately after the client connects
	send({
		type: 'snapshot',
		running: bitcoind.status().running,
		exit: bitcoind.exitInfo, // null if never crashed
	})

	// Pushes "exit" events whenever bitcoind stops unexpectedly
	const handler = (info: ExitInfo) => send({type: 'exit', ...info})

	bitcoind.events.on('exit', handler)
	socket.on('close', () => bitcoind.events.off('exit', handler))
}
