import {useQuery} from '@tanstack/react-query'

import {api} from '@/lib/api'

import type {ConnectionDetails} from '@umbrel-bitcoin/shared-types'

// TODO: decide on cache times
export function useConnectionDetails() {
	return useQuery({
		queryKey: ['connections'],
		queryFn: () => api<ConnectionDetails>('/connect/details'),
		staleTime: 60_000,
		refetchInterval: 60_000,
	})
}
