import {rpcClient} from '../bitcoind/rpc-client.js'

import type {PeerInfo, PeerSummary} from '@umbrel-bitcoin/shared-types'

// We cache the peer info for so that multiple pages on the UI can share the same data when toggling quickly between views
let cache: {data: PeerInfo[]; expiry: number} | null = null

async function getPeerInfo(): Promise<PeerInfo[]> {
	// return cached data if it exists and is not expired
	if (cache && cache.expiry > Date.now()) return cache.data

	// fetch new data from bitcoind if cache is older than 5 seconds
	const data = await rpcClient.command<PeerInfo[]>('getpeerinfo')
	cache = {data, expiry: Date.now() + 5_000}

	return data
}

// Full getpeerinfo response
export async function peerInfo(): Promise<PeerInfo[]> {
	return getPeerInfo()
}

// Summary of number of peers by network and incoming/outgoing
export async function peerSummary(): Promise<PeerSummary> {
	const peers = await getPeerInfo()

	// network can be ipv4, ipv6, onion, i2p, cjdns, not_publicly_routable
	const summary: PeerSummary = {total: peers.length, byNetwork: {}}

	for (const p of peers) {
		const bucket = (summary.byNetwork[p.network] ??= {inbound: 0, outbound: 0})

		if (p.inbound) bucket.inbound++
		else bucket.outbound++
	}

	return summary
}
