import {useQuery} from '@tanstack/react-query'
import {api} from '@/lib/api'
import type {BlockReward} from '#types'

// TODO: settle on cache times
export function useBlockRewards(limit = 144, opts?: {enabled?: boolean}) {
	const {enabled = true} = opts ?? {}

	return useQuery<BlockReward[]>({
		queryKey: ['rpc', 'blocks', 'rewards', limit],
		queryFn: () => api<BlockReward[]>(`/rpc/blocks/rewards?limit=${limit}`),
		staleTime: 60_000,
		refetchInterval: 60_000,
		enabled,
	})
}
