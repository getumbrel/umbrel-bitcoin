// Bitcoin Core's ZMQ block notifiers are silent until the node finishes Initial Block Download
// https://github.com/bitcoin/bitcoin/blob/31d3eebfb92ae0521e18225d69be95e78fb02672/src/zmq/zmqnotificationinterface.cpp#L150-L158

import {EventEmitter} from 'node:events'

import zmq from 'zeromq'

import {bitcoind} from '../bitcoind/bitcoind.js'

// This emits the block hash whenever a new block is announced
export const blockStream = new EventEmitter()

let currentSubscriber: zmq.Subscriber | null = null
let generation = 0

async function startBlockSubscriber(): Promise<void> {
	const gen = ++generation

	const sub = new zmq.Subscriber()
	currentSubscriber = sub
	sub.connect(`tcp://0.0.0.0:${process.env['ZMQ_HASHBLOCK_PORT'] || '28334'}`)
	sub.subscribe('hashblock')

	for await (const [, hashBuffer] of sub) {
		if (gen !== generation) break
		blockStream.emit('block', hashBuffer.toString('hex'))
	}
}

function stopBlockSubscriber() {
	generation++
	if (currentSubscriber) {
		console.log('[block-subscriber] Stopping block subscriber')
		currentSubscriber.close()
		currentSubscriber = null
	}
}

// Tear down on stop/exit, restart on start. The handler in blocks.ts already
// guards against catch-up events (blocks !== headers), so no sync gate needed here.
bitcoind.events.on('stop', stopBlockSubscriber)
bitcoind.events.on('exit', stopBlockSubscriber)

bitcoind.events.on('start', () => {
	console.log('[block-subscriber] Bitcoind started, starting block subscriber')
	startBlockSubscriber().catch((err) => console.error('ZMQ hashblock subscriber crashed:', err))
})

startBlockSubscriber().catch((err) => console.error('ZMQ hashblock subscriber crashed:', err))
