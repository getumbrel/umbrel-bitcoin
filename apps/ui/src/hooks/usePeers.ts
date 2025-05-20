import {useQuery} from '@tanstack/react-query'
import {api} from '@/lib/api'
import type {PeerTally} from '@umbrel-bitcoin/shared-types'

export function usePeers() {
	return useQuery({
		queryKey: ['peers'],
		queryFn: () => api<PeerTally>('/rpc/peers'),
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
