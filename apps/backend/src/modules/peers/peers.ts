import {rpcClient} from '../bitcoind/rpc-client.js'

import type {PeerInfo, PeerCount, PeerLocation} from '@umbrel-bitcoin/shared-types'
import {ipToLatLng} from './ip-to-location.js'
import {cache} from '../../lib/cache.js'

// Cached getpeerinfo response
const getPeerInfoRPC = () => cache('peerinfo', 5_000, () => rpcClient.command<PeerInfo[]>('getpeerinfo'))

// Raw bitcoind getpeerinfo response
export async function peerInfo(): Promise<PeerInfo[]> {
	return getPeerInfoRPC()
}

// Count peers by network + direction (incoming vs outgoing)
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

// Geolocated (or faked) latitude and longitude for each peer
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
