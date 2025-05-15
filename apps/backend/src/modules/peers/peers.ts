import type {PeerTally} from '@umbrel-bitcoin/shared-types'
import {rpcClient} from '../bitcoind/rpc-client.js'

// Tally peers by network and incoming/outgoing
export async function tally(): Promise<PeerTally> {
	const peers = await rpcClient.command('getpeerinfo')

	// network can be ipv4, ipv6, onion, i2p, cjdns, not_publicly_routable
	const tally: PeerTally = {total: peers.length, byNetwork: {}}

	for (const p of peers) {
		const bucket = (tally.byNetwork[p.network] ??= {inbound: 0, outbound: 0})

		if (p.inbound) bucket.inbound++
		else bucket.outbound++
	}

	return tally
}
