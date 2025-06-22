// Bitcoin Core’s ZMQ `pubhashtx` transaction notifier is NOT SILENT during IBD and initial Bitcoin Core startup (unlike `pubhashblock`)
// We  wait until the mempool is loaded and IBD is complete before subscribing to `pubhashtx` or else we would receive a flood of tx notifications during startup and all throughout IBD
//
// IBD behaviour:
// During IBD, the node is validating old blocks; every “new-to-mempool” tx found in those blocks still triggers a `pubhashtx` notification.
//
// Mempool behaviour:
// On startup, as soon as the node finishes reading `mempool.dat` it replays every tx it loaded (likely tens of thousands on a mainnet node) – each one fires a `hashtx`.

import {EventEmitter} from 'node:events'
import zmq from 'zeromq'
import {rpcClient} from '../bitcoind/rpc-client.js'

async function waitIbdComplete(pollMs = 5_000): Promise<void> {
	// Our server doesn't wait for bitciond to be up and the RPC port to be ready, so we
	// swallow any errors until the RPC port is ready
	for (;;) {
		try {
			const {initialblockdownload} = await rpcClient.command('getblockchaininfo')
			if (initialblockdownload === false) return
		} catch {
			// rpc not ready yet or bitcoind is down
		}
		await new Promise((r) => setTimeout(r, pollMs))
	}
}

async function waitMempoolLoaded(pollMs = 2_000): Promise<void> {
	// Our server doesn't wait for bitciond to be up and the RPC port to be ready, so we
	// swallow any errors until the RPC port is ready
	for (;;) {
		try {
			const {loaded} = await rpcClient.command('getmempoolinfo')
			if (loaded) return
		} catch {
			// rpc not ready yet or bitcoind is down
		}
		await new Promise((r) => setTimeout(r, pollMs))
	}
}

export const transactionStream = new EventEmitter()

async function startTransactionSubscriber(): Promise<void> {
	// We only subscribe to `pubhashtx` after IBD is complete and the mempool is loaded
	// If bitcoind is synced within a day of the tip, then IBD is false, so we may get a huge burst of txs on startup as bitcoind quickly catches up to the chain tip
	await waitIbdComplete()
	await waitMempoolLoaded()

	const sub = new zmq.Subscriber()
	sub.connect(`tcp://0.0.0.0:${process.env['ZMQ_HASHTX_PORT'] || '28336'}`)
	sub.subscribe('hashtx')

	for await (const msg of sub) {
		// We don’t need the hash itself – just the signal
		void msg
		transactionStream.emit('hashtx')
	}
}

startTransactionSubscriber().catch((err) => console.error('ZMQ hashtx subscriber crashed:', err))
