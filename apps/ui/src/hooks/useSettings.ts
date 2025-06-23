import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {api} from '@/lib/api'
import type {SettingsSchema} from '#settings'

// TODO: set actual cache times. We don't expect settings to change until the user updates them.
export function useSettings() {
	return useQuery({
		queryKey: ['config', 'settings'],
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
			qc.setQueryData(['config', 'settings'], fresh)

			// clear crash UI
			qc.setQueryData(['bitcoind', 'exit'], null)

			// Purge and kickoff background refetches for rpc data
			qc.removeQueries({queryKey: ['rpc']})
			qc.invalidateQueries({queryKey: ['rpc']})
		},
	})
}

export function useRestoreDefaults() {
	const qc = useQueryClient()

	return useMutation({
		// No payload – just POST with empty body
		mutationFn: () => api<SettingsSchema>('/config/restore-defaults', {method: 'POST', body: {}}),

		onSuccess: (fresh) => {
			qc.setQueryData(['config', 'settings'], fresh)

			// clear crash UI
			qc.setQueryData(['bitcoind', 'exit'], null)

			// Purge and kickoff background refetches for rpc data
			qc.removeQueries({queryKey: ['rpc']})
			qc.invalidateQueries({queryKey: ['rpc']})
		},
	})
}
