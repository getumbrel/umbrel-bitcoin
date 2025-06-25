import {useQuery, useQueryClient} from '@tanstack/react-query'
import {useEffect} from 'react'

import {api} from '@/lib/api'
import {useWebSocketToken} from './useWebSocketToken'

import type {BlockSummary} from '#types'
import type {SyncStage} from '@/lib/sync-progress'

// REST and WebSocket data source for the "latest 5 blocks" component on the home page
// During IBD (`stage === 'IBD'`) bitcoind's ZMQ is silent, so we poll the REST API
// every 3s to keep up with the rapidly increasing tip.
// Once bitcoind is out of IBD (`stage === 'synced'`) we switch to a real-time
// WebSocket fed by bitcoind's ZMQ, and fall back to a slow 60s REST poll just in
// case the socket drops.
// We skip polling and WebSocket during `pre-headers` and `headers` stages

// TODO: If bitcoind has already undergone IBD, and then is off for a while and then comes back online with many
// blocks to catch up on, does Core show IBD again?

export function useLatestBlocks({limit = 5, stage}: {limit?: number; stage: SyncStage}) {
	const qc = useQueryClient()
	const {data} = useWebSocketToken()

	// REST polling
	const pollMs =
		stage === 'IBD'
			? 3_000 // fast while blocks fly in
			: stage === 'synced'
				? 10_000 // lazy safety poll
				: false // no fetch during pre-headers / headers

	const query = useQuery<BlockSummary[]>({
		queryKey: ['rpc', 'blocks', 'latest', limit],
		queryFn: () => api<{blocks: BlockSummary[]}>(`/rpc/blocks?limit=${limit}`).then((r) => r.blocks),
		enabled: stage === 'IBD' || stage === 'synced', // skip during pre-headers / headers
		refetchInterval: pollMs,
		staleTime: pollMs === false ? undefined : pollMs,
	})

	// Websocket
	useEffect(() => {
		if (!data?.token) return

		// We only use WebSocket when out of IBD because bitcoind's ZMQ is silent until then
		// But the backend guards against sending blocks before we're at the tip
		if (stage !== 'synced') return

		let ws: WebSocket | undefined
		let retry = 0

		const open = () => {
			ws = new WebSocket(`${location.origin.replace(/^http/, 'ws')}/api/ws/blocks?token=${data?.token}`)

			ws.onmessage = (ev) => {
				try {
					const block: BlockSummary = JSON.parse(ev.data)
					qc.setQueryData<BlockSummary[]>(['rpc', 'blocks', 'latest', limit], (old) => {
						const list = old ?? []
						if (list.some((b) => b.hash === block.hash)) return list
						return [block, ...list].sort((a, b) => b.height - a.height).slice(0, limit)
					})
				} catch {
					/* ignore bad JSON */
				}
			}

			ws.onclose = () => {
				// Exponential back-off
				retry = Math.min(retry + 1, 6)
				setTimeout(open, 1_000 * 2 ** (retry - 1))
			}
			ws.onerror = () => ws?.close()
		}

		open()
		return () => ws?.close()
	}, [stage, qc, limit, data?.token])

	return query
}
