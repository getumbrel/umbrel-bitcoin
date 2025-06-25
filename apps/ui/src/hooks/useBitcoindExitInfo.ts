// Hook to get the most-recent ExitInfo *from React-Query cache*
// The useBitcoindExitSocket ws hook keeps the cache up-to-date in real time.

import {useQuery, useQueryClient} from '@tanstack/react-query'

import {api} from '@/lib/api'
import type {ExitInfo} from '#types'

export function useBitcoindExitInfo() {
	const qc = useQueryClient()

	return useQuery<ExitInfo | null>({
		queryKey: ['bitcoind', 'exit'],
		initialData: () => qc.getQueryData(['bitcoind', 'exit']) as ExitInfo | null,

		// Will fetch only if the cache hasn't been filled by the WebSocket yet
		enabled: qc.getQueryData(['bitcoind', 'exit']) === undefined,
		queryFn: () => api<ExitInfo | null>('/bitcoind/exit-info'),
		staleTime: 30_000,
	})
}
