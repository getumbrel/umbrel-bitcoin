// src/hooks/useBitcoind.ts
import {useQuery} from '@tanstack/react-query'
import {api} from '@/lib/api'
import type {BitcoindStatus, BitcoindVersion} from '@umbrel-bitcoin/shared-types'

// TODO: decide on refetchInterval if any
export function useBitcoindVersion() {
	return useQuery({
		queryKey: ['bitcoindVersion'],
		queryFn: () => api<BitcoindVersion>('/bitcoind/version'),
		// refetchInterval: 5_000,
		staleTime: Infinity, // never changes until user updates
	})
}

export function useBitcoindStatus() {
	return useQuery({
		queryKey: ['bitcoindStatus'],
		queryFn: () => api<BitcoindStatus>('/bitcoind/status'),
		refetchInterval: 5_000, // poll every 5 s
		staleTime: 2_500, // treat cache as fresh between polls
	})
}
