import type WebSocket from 'ws'
import {transactionStream} from './zmq-subscriber.js'

// We send one ping per transaction, but limit the rate to a max of 10 pings per second.
// This is probably the max the UI can handle without animation overload.
const TXS_PER_PING = 1
const MIN_INTERVAL_MS = 100

const clients = new Set<WebSocket>()

function broadcastPing() {
	const msg = '{"type":"txPing"}'
	for (const ws of clients) {
		if (ws.readyState === ws.OPEN) ws.send(msg)
	}
}

let txBucket = 0
let lastPing = 0

transactionStream.on('hashtx', () => {
	txBucket += 1

	const now = Date.now()
	if (txBucket >= TXS_PER_PING && now - lastPing >= MIN_INTERVAL_MS) {
		txBucket = 0
		lastPing = now
		console.log('TRANSACTIONNNNNNNNNNNNNNNNNN')
		broadcastPing()
	}
})

// WebSocket push for new transactions
export function wsStream(socket: WebSocket) {
	clients.add(socket)
	socket.on('close', () => clients.delete(socket))
}
