import {useQuery} from '@tanstack/react-query'
import {api} from '@/lib/api'
import type {PeerInfo, PeerCount, PeerLocation} from '@umbrel-bitcoin/shared-types'

// TODO: settle on cache times
export function usePeerCount() {
	return useQuery({
		queryKey: ['peers/count'],
		queryFn: () => api<PeerCount>('/rpc/peers/count'),
		staleTime: 30_000,
		refetchInterval: 5_000,
	})
}

export function usePeerInfo() {
	return useQuery({
		queryKey: ['peers/info'],
		queryFn: () => api<PeerInfo[]>('/rpc/peers/info'),
		staleTime: 30_000,
		refetchInterval: 5_000,
	})
}

export function usePeerLocations() {
	return useQuery({
		queryKey: ['peers/locations'],
		queryFn: () => api<PeerLocation[]>('/rpc/peers/locations'),
		staleTime: 30_000,
		refetchInterval: 5_000,
	})
}

// MOCKED DATA

// export function usePeers() {
// 	return useQuery({
// 		queryKey: ['peers'],
// 		queryFn: async () =>
// 			({
// 				total: 11,
// 				byNetwork: {
// 					ipv4: {inbound: 1, outbound: 2},
// 					ipv6: {inbound: 1, outbound: 2},
// 					onion: {inbound: 0, outbound: 2},
// 					i2p: {inbound: 0, outbound: 1},
// 					cjdns: {inbound: 0, outbound: 1},
// 					not_publicly_routable: {inbound: 1, outbound: 0},
// 				},
// 			}) as PeerTally,
// 		refetchInterval: 30_000,
// 		staleTime: 5_000,
// 	})
// }
