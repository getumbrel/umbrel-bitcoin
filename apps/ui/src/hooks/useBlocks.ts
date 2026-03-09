import {useQuery} from '@tanstack/react-query'

import {api} from '@/lib/api'

import type {Block} from '#types'
import type {SyncStage} from '@/lib/sync-progress'

// Pure REST query for Block[] data.
// Used by both the home page (limit=5) and insights charts (limit=200).
//
// Data flow:
//   1. Initial fetch on mount (or when stage transitions to 'synced')
//   2. Real-time updates via useBlockStream (single global WebSocket in Layout)
//   3. refetchOnWindowFocus (React Query default) catches up after tab blur
//
// No polling — WebSocket is the primary update channel, REST is only for
// initial load and focus recovery.

export function useBlocks({limit = 200, stage}: {limit?: number; stage: SyncStage}) {
	return useQuery<Block[]>({
		queryKey: ['rpc', 'blocks', limit],
		queryFn: () => api<Block[]>(`/rpc/blocks?limit=${limit}`),
		enabled: stage === 'synced',
	})
}
