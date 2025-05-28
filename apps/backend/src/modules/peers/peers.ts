import {rpcClient} from '../bitcoind/rpc-client.js'

import type {PeerInfo, PeerCount, PeerLocation} from '@umbrel-bitcoin/shared-types'
import {ipToLatLng} from './ip-to-location.js'

// We cache the peer info so that multiple methods below can share the same data on quick request intervals
// and also to limit the number of requests to bitcoind from multiple tabs being open or DDoS
let cache: {data: PeerInfo[]; expiry: number} | null = null

async function getPeerInfoRPC(): Promise<PeerInfo[]> {
	// return cached data if it exists and is not expired
	if (cache && cache.expiry > Date.now()) return cache.data

	// fetch new data from bitcoind if cache is older than 5 seconds
	const data = await rpcClient.command<PeerInfo[]>('getpeerinfo')
	cache = {data, expiry: Date.now() + 5_000}

	return data
}

// Full getpeerinfo response
export async function peerInfo(): Promise<PeerInfo[]> {
	return getPeerInfoRPC()
}

// Summary of number of peers by network and incoming/outgoing
export async function peerCount(): Promise<PeerCount> {
	const peers = await getPeerInfoRPC()

	// network can be ipv4, ipv6, onion, i2p, cjdns, not_publicly_routable
	const summary: PeerCount = {total: peers.length, byNetwork: {}}

	for (const p of peers) {
		const bucket = (summary.byNetwork[p.network] ??= {inbound: 0, outbound: 0})

		if (p.inbound) bucket.inbound++
		else bucket.outbound++
	}

	return summary
}

// Lat/long for each peer
export async function peerLocations(): Promise<PeerLocation[]> {
	const peers = await getPeerInfoRPC()
	return peers.map((p) => {
		const ip = p.addr.replace(/^\[?([^\]]+)]?:\d+$/, '$1')
		return {
			addr: ip,
			network: p.network,
			location: ipToLatLng(ip, p.network),
		}
	})
}
