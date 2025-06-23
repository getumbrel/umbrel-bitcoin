import {peerCount} from '../peers/peers.js'
import {rpcClient} from '../bitcoind/rpc-client.js'
import {bitcoind} from '../bitcoind/bitcoind.js'
import type {Stats} from '#types'

export async function summary(): Promise<Stats> {
	const [peerSum, mempool, chainInfo] = await Promise.all([
		peerCount(), // already cached 5s in peers.ts
		rpcClient.command('getmempoolinfo'),
		rpcClient.command('getblockchaininfo'),
	])

	const {startedAt, running} = bitcoind.status()

	return {
		peers: peerSum.total,
		mempoolBytes: mempool.usage,
		chainBytes: chainInfo.size_on_disk,
		uptimeSec: running && startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0,
	}
}
