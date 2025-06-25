import {useQuery} from '@tanstack/react-query'
import {api} from '@/lib/api'
import type {PeerInfo, PeerCount, PeerLocationsResponse} from '#types'

// TODO: settle on cache times
export function usePeerCount() {
	return useQuery({
		queryKey: ['rpc', 'peers', 'count'],
		queryFn: () => api<PeerCount>('/rpc/peers/count'),
		staleTime: 30_000,
		refetchInterval: 5_000,
	})
}

export function usePeerInfo() {
	return useQuery({
		queryKey: ['rpc', 'peers', 'info'],
		queryFn: () => api<PeerInfo[]>('/rpc/peers/info'),
		staleTime: 30_000,
		refetchInterval: 5_000,
	})
}

export function usePeerLocations() {
	return useQuery({
		queryKey: ['rpc', 'peers', 'locations'],
		queryFn: () => api<PeerLocationsResponse>('/rpc/peers/locations'),
		staleTime: 30_000,
		refetchInterval: 5_000,
	})
}
