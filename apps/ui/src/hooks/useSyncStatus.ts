import {useQuery} from '@tanstack/react-query'
import {api} from '@/lib/api'
import type {SyncStatus} from '@umbrel-bitcoin/shared-types'

export function useSyncStatus() {
	return useQuery({
		queryKey: ['syncStatus'],
		queryFn: () => api<SyncStatus>('/rpc/sync'),
		refetchInterval: 2_000,
		staleTime: 5_000,
	})
}
