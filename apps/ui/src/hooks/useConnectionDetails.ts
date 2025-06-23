import {useQuery} from '@tanstack/react-query'

import {api} from '@/lib/api'

import type {ConnectionDetails} from '#types'

// TODO: decide on cache times
export function useConnectionDetails() {
	return useQuery({
		queryKey: ['connect', 'details'],
		queryFn: () => api<ConnectionDetails>('/connect/details'),
		staleTime: 60_000,
		refetchInterval: 60_000,
	})
}
