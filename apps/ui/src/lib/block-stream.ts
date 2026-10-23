import type {QueryClient} from '@tanstack/react-query'
import type {Block} from '#types'

export function blockStreamHandlers(qc: QueryClient) {
	return {
		onOpen: () => {
			// Catch up any blocks missed while disconnected (including a backend restart).
			void qc.invalidateQueries({queryKey: ['rpc', 'blocks']})
		},
		onMessage: (ev: MessageEvent) => {
			try {
				const block: Block = JSON.parse(ev.data)
				// Cancel a catch-up response that could overwrite this event with an older tip.
				const catchUp = qc.isFetching({queryKey: ['rpc', 'blocks']})
					? qc.cancelQueries({queryKey: ['rpc', 'blocks']})
					: undefined

				// Update every ['rpc', 'blocks', *] cache (limit=5, limit=200, etc.)
				qc.setQueriesData<Block[]>({queryKey: ['rpc', 'blocks']}, (old) => {
					if (!old) return old
					if (old.some((b) => b.hash === block.hash)) return old
					// Maintain oldest-first order (matching REST response)
					return [...old, block].sort((a, b) => a.height - b.height).slice(-old.length)
				})
				if (catchUp) void catchUp.then(() => qc.invalidateQueries({queryKey: ['rpc', 'blocks']}))
			} catch {
				/* ignore bad JSON */
			}
		},
	}
}
