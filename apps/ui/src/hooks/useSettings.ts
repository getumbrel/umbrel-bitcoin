import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {api} from '@/lib/api'
import type {SettingsSchema} from '@umbrel-bitcoin/settings'

// TODO: set actual cache times. We don't expect settings to change until the user updates them.
export function useSettings() {
	return useQuery({
		queryKey: ['settings'],
		queryFn: () => api<SettingsSchema>('/config/settings'),
		// Tune these to taste
		staleTime: 30_000,
		refetchInterval: 30_000,
	})
}

export function useUpdateSettings() {
	const qc = useQueryClient()

	return useMutation({
		// `data` is the *partial* diff from the settings form
		mutationFn: (data: Partial<SettingsSchema>) =>
			api<SettingsSchema>('/config/settings', {method: 'PATCH', body: data}),

		// Update/invalidate the cache so all components see the new values
		onSuccess: (fresh) => {
			qc.setQueryData(['settings'], fresh)
			qc.setQueryData(['bitcoindExit'], null) // clear bticoind crash state

			// TODO: refetch / invalidate other queries that will change due to bitcoind restart
			// qc.invalidateQueries({ queryKey: ['peers/info'] })
		},
	})
}
