import {useQuery} from '@tanstack/react-query'
import {api} from '@/lib/api'
import type {BlockReward} from '@umbrel-bitcoin/shared-types'

// TODO: settle on cache times
export function useBlockRewards(limit = 144) {
	return useQuery({
		queryKey: ['rewards', limit],
		queryFn: () => api<BlockReward[]>(`/rpc/blocks/rewards?limit=${limit}`),
		staleTime: 60_000,
		refetchInterval: 60_000,
	})
}
