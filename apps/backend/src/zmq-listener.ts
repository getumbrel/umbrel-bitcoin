// TODO: implement this properly
import zmq from 'zeromq'
import {getRpc} from './rpc-client.js'
import EventEmitter from 'node:events'

export const blockStream = new EventEmitter()

;(async () => {
	const sock = new zmq.Subscriber()
	sock.connect('tcp://127.0.0.1:28332')
	sock.subscribe('hashblock')

	for await (const [_topic, hashBuf] of sock) {
		const hash = hashBuf.toString('hex')

		try {
			const hdr = await getRpc().command('getblockheader', hash, true)

			blockStream.emit('block', {
				hash,
				height: hdr.height,
				txs: hdr.nTx,
				time: hdr.time,
			})
		} catch (err) {
			console.error(err, `RPC getblockheader failed for ${hash}`)
			// loop continues – next ZMQ event will be processed
		}
	}
})()
