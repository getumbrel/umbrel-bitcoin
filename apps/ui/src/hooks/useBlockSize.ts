import {useQuery} from '@tanstack/react-query'
import {api} from '@/lib/api'
import type {BlockSizeSample} from '@umbrel-bitcoin/shared-types'

// TODO: settle on cache times
export function useBlockSize(limit = 144) {
	return useQuery({
		queryKey: ['block-size', limit],
		queryFn: () => api<BlockSizeSample[]>(`/rpc/blocks/size?limit=${limit}`),
		staleTime: 60_000,
		refetchInterval: 120_000,
	})
}
