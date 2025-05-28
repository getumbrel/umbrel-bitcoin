import {useQuery} from '@tanstack/react-query'
import {api} from '@/lib/api'
import type {BlockSummary} from '@umbrel-bitcoin/shared-types'

const LIMIT = 5
const POLL_MS = 10_000

export const useBlocks = () =>
	useQuery<BlockSummary[]>({
		queryKey: ['latest-blocks', LIMIT],
		queryFn: () => api<{blocks: BlockSummary[]}>(`/rpc/blocks?limit=${LIMIT}`).then((r) => r.blocks),
		refetchInterval: POLL_MS,
		staleTime: POLL_MS,
	})
