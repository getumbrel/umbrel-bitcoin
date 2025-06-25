// Bitcoin Core's ZMQ block notifiers are silent until the node finishes Initial Block Download
// https://github.com/bitcoin/bitcoin/blob/31d3eebfb92ae0521e18225d69be95e78fb02672/src/zmq/zmqnotificationinterface.cpp#L150-L158

import {EventEmitter} from 'node:events'

import zmq from 'zeromq'

// This emits the block hash whenever a new block is announced
export const blockStream = new EventEmitter()

// Subscribe to ZMQ `hashblock` and push hashes into `blockStream`
async function startBlockSubscriber(): Promise<void> {
	const subscriber = new zmq.Subscriber()

	subscriber.connect(`tcp://0.0.0.0:${process.env['ZMQ_HASHBLOCK_PORT'] || '28334'}`)
	subscriber.subscribe('hashblock')

	for await (const [, hashBuffer] of subscriber) {
		const hash = hashBuffer.toString('hex')
		blockStream.emit('block', hash)
	}
}

startBlockSubscriber().catch((err) => console.error('ZMQ subscriber crashed:', err))
