import {useQuery} from '@tanstack/react-query'
import {api} from '@/lib/api'
import type {BlockSizeSample} from '#types'

// TODO: settle on cache times
export function useBlockSize(limit = 144, opts?: {enabled?: boolean}) {
	const {enabled = true} = opts ?? {}

	return useQuery({
		queryKey: ['rpc', 'blocks', 'size', limit],
		queryFn: () => api<BlockSizeSample[]>(`/rpc/blocks/size?limit=${limit}`),
		staleTime: 60_000,
		refetchInterval: 120_000,
		enabled,
	})
}
