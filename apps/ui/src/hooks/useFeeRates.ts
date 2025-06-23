import {api} from '@/lib/api'
import {useQuery} from '@tanstack/react-query'
import type {FeeRatePoint} from '#types'

// TODO: settle on cache times
export function useFeeRates(limit = 144, opts?: {enabled?: boolean}) {
	const {enabled = true} = opts ?? {}

	return useQuery({
		queryKey: ['rpc', 'blocks', 'fees', limit],
		queryFn: () => api<FeeRatePoint[]>(`/rpc/blocks/fees?limit=${limit}`),
		staleTime: 60_000,
		refetchInterval: 120_000,
		enabled,
	})
}
