import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {api} from '@/lib/api'

type CustomConfigResponse = {lines: string}

// Returns `{ lines }` where `lines` is the text after the banner in bitcoin.conf.
export function useCustomConfig() {
	return useQuery({
		queryKey: ['config', 'custom-options'],
		queryFn: () => api<CustomConfigResponse>('/config/custom-options'),
		staleTime: 30_000,
	})
}

// Save the custom config to the backend
export function useSaveCustomConfig() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: (lines: string) => api('/config/custom-options', {method: 'PATCH', body: {lines}}),

		onSuccess: () => {
			// refresh textarea
			qc.invalidateQueries({queryKey: ['config', 'custom-options']})

			// clear crash UI
			qc.setQueryData(['bitcoind', 'exit'], null)

			// Purge and kickoff background refetches for rpc data
			qc.removeQueries({queryKey: ['rpc']})
			qc.invalidateQueries({queryKey: ['rpc']})
		},
	})
}
