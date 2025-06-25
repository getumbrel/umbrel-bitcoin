import {useQuery} from '@tanstack/react-query'
import {api} from '@/lib/api'
import type {Stats} from '#types'

// TODO: settle on cache times
export function useStats() {
	return useQuery({
		queryKey: ['rpc', 'stats'],
		queryFn: () => api<Stats>('/rpc/stats'),
		staleTime: 10_000,
		refetchInterval: 10_000,
	})
}
