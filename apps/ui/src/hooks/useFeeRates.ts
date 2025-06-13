import {api} from '@/lib/api'
import {useQuery} from '@tanstack/react-query'
import type {FeeRatePoint} from '@umbrel-bitcoin/shared-types'

// TODO: settle on cache times
export function useFeeRates(limit = 144, opts?: {enabled?: boolean}) {
	const {enabled = true} = opts ?? {}

	return useQuery({
		queryKey: ['fee-rates', limit],
		queryFn: () => api<FeeRatePoint[]>(`/rpc/blocks/fees?limit=${limit}`),
		staleTime: 60_000,
		refetchInterval: 120_000,
		enabled,
	})
}
