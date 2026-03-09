// Bitcoin Core's ZMQ `pubhashtx` transaction notifier is NOT SILENT during IBD and initial Bitcoin Core startup (unlike `pubhashblock`)
// We wait until the node is fully synced (IBD complete AND blocks === headers) and the mempool
// is loaded before subscribing to `pubhashtx`, or else we would receive a flood of tx
// notifications during startup, IBD, and catch-up.
//
// IBD behaviour:
// During IBD, the node is validating old blocks; every "new-to-mempool" tx found in those blocks still triggers a `pubhashtx` notification.
//
// Catch-up behaviour:
// When the node was offline or just exited IBD (Core flips IBD false when the chain tip is
// within ~24h of real time), blocks may still lag behind headers. ZMQ fires for every tx in
// every block being validated during catch-up. `waitIbdComplete()` alone is insufficient —
// we must also wait for blocks === headers.
//
// Mempool behaviour:
// On startup, as soon as the node finishes reading `mempool.dat` it replays every tx it loaded (likely tens of thousands on a mainnet node) – each one fires a `hashtx`.

import {EventEmitter} from 'node:events'
import zmq from 'zeromq'

import {rpcClient} from '../bitcoind/rpc-client.js'
import {bitcoind} from '../bitcoind/bitcoind.js'

async function waitSynced(pollMs = 5_000): Promise<void> {
	// Wait until IBD is complete AND blocks have caught up to headers.
	// We swallow errors until the RPC port is ready.
	for (;;) {
		try {
			const {initialblockdownload, blocks, headers} = await rpcClient.command<{
				initialblockdownload: boolean
				blocks: number
				headers: number
			}>('getblockchaininfo')
			if (!initialblockdownload && blocks === headers) return
		} catch {
			// rpc not ready yet or bitcoind is down
		}
		await new Promise((r) => setTimeout(r, pollMs))
	}
}

async function waitMempoolLoaded(pollMs = 2_000): Promise<void> {
	// Our server doesn't wait for bitcoind to be up and the RPC port to be ready, so we
	// swallow any errors until the RPC port is ready
	for (;;) {
		try {
			const {loaded} = await rpcClient.command<{loaded: boolean}>('getmempoolinfo')
			if (loaded) return
		} catch {
			// rpc not ready yet or bitcoind is down
		}
		await new Promise((r) => setTimeout(r, pollMs))
	}
}

export const transactionStream = new EventEmitter()

let currentSubscriber: zmq.Subscriber | null = null
// Generation counter to cancel stale startTransactionSubscriber() calls.
// When stopTransactionSubscriber() runs, it bumps the generation. Any in-flight
// async call (stuck polling in waitSynced/waitMempoolLoaded) will see its
// generation is stale and bail out instead of subscribing.
let generation = 0

async function startTransactionSubscriber(): Promise<void> {
	const gen = ++generation

	// We only subscribe to `pubhashtx` after the node is fully synced and the mempool is loaded.
	// If bitcoind is synced within a day of the tip, then IBD is false, so we also check
	// blocks === headers to avoid the catch-up flood.
	await waitSynced()
	if (gen !== generation) return // cancelled by a stop/restart

	await waitMempoolLoaded()
	if (gen !== generation) return // cancelled by a stop/restart

	const sub = new zmq.Subscriber()
	currentSubscriber = sub
	sub.connect(`tcp://0.0.0.0:${process.env['ZMQ_HASHTX_PORT'] || '28336'}`)
	sub.subscribe('hashtx')

	for await (const msg of sub) {
		if (gen !== generation) break
		// We don't need the hash itself – just the signal
		void msg
		transactionStream.emit('hashtx')
	}
}

function stopTransactionSubscriber() {
	generation++ // invalidate any pending startTransactionSubscriber calls
	if (currentSubscriber) {
		console.log('[tx-subscriber] Stopping transaction subscriber')
		currentSubscriber.close()
		currentSubscriber = null
	}
}

// Listen for bitcoind lifecycle events
// When bitcoind is restarted via the UI settings page, we need to tear down the existing subscriber and start a new one
// with the waitSynced and waitMempoolLoaded logic or else we would receive a flood of tx notifications during startup and all throughout IBD
// if the user changed from a synced chain (say signet) to an unsynced chain (say mainnet)
bitcoind.events.on('stop', stopTransactionSubscriber)
bitcoind.events.on('exit', stopTransactionSubscriber)

bitcoind.events.on('start', () => {
	console.log('[tx-subscriber] Bitcoind started, starting transaction subscriber')
	startTransactionSubscriber().catch((err) => console.error('ZMQ hashtx subscriber crashed:', err))
})

startTransactionSubscriber().catch((err) => console.error('ZMQ hashtx subscriber crashed:', err))
