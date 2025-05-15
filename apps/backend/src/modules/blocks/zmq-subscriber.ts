// Bitcoin Core’s ZMQ notifiers are silent until the node finishes Initial Block Download
// https://github.com/bitcoin/bitcoin/blob/31d3eebfb92ae0521e18225d69be95e78fb02672/src/zmq/zmqnotificationinterface.cpp#L150-L158

import {EventEmitter} from 'node:events'

import zmq from 'zeromq'

import {rpcClient} from '../bitcoind/rpc-client.js'

// This emits `{ hash, height, txs, time }` whenever a new block is announced
export const blockStream = new EventEmitter()

// Subscribe to ZMQ `hashblock` and push parsed headers into `blockStream`
async function startBlockSubscriber(): Promise<void> {
	const subscriber = new zmq.Subscriber()

	// TODO: read endpoint from env
	subscriber.connect('tcp://127.0.0.1:28332')
	subscriber.subscribe('hashblock')

	for await (const [, hashBuffer] of subscriber) {
		const hash = hashBuffer.toString('hex')

		try {
			// verbosity = true gives us a JSON object instead of a serialized string
			const header = await rpcClient.command('getblockheader', hash, true)

			blockStream.emit('block', {
				hash,
				height: header.height,
				txs: header.nTx,
				time: header.time,
			})
		} catch (error) {
			console.error('getblockheader failed:', error)
		}
	}
}

startBlockSubscriber().catch((err) => console.error('ZMQ subscriber crashed:', err))
