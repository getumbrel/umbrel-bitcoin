import {useEffect} from 'react'
import {useQueryClient} from '@tanstack/react-query'

import type {BlockReward, BlockSizeSample, FeeRatePoint, Stats} from '@umbrel-bitcoin/shared-types'
import type {PeerInfo} from '@umbrel-bitcoin/shared-types'

import {api} from '@/lib/api'

const NUM_BLOCKS = 200

// TODO: consider exporting queryKey's from a shared file so they don't get out of sync with other hooks
export function usePrefetchInsights() {
	const queryClient = useQueryClient()

	useEffect(() => {
		const prefetch = () => {
			queryClient.prefetchQuery({
				queryKey: ['stats', 'summary'],
				queryFn: () => api<Stats>('/rpc/stats'),
			})
			queryClient.prefetchQuery({
				queryKey: ['rewards', NUM_BLOCKS],
				queryFn: () => api<BlockReward[]>(`/rpc/blocks/rewards?limit=${NUM_BLOCKS}`),
			})
			queryClient.prefetchQuery({
				queryKey: ['block-size', NUM_BLOCKS],
				queryFn: () => api<BlockSizeSample[]>(`/rpc/blocks/size?limit=${NUM_BLOCKS}`),
			})
			queryClient.prefetchQuery({
				queryKey: ['fee-rates', NUM_BLOCKS],
				queryFn: () => api<FeeRatePoint[]>(`/rpc/blocks/fees?limit=${NUM_BLOCKS}`),
			})
			queryClient.prefetchQuery({
				queryKey: ['peers/info'],
				queryFn: () => api<PeerInfo[]>('/rpc/peers/info'),
			})
		}

		// We could also use requestIdleCallback, but it's not supported in all browsers and won't work in React's Strict mode during dev.
		// requestAnimationFrame fires on the next frame after the first paint, so it never delays
		// a page's render or its own fetches; all network requests run in parallel.
		const id = requestAnimationFrame(prefetch)

		// Cleanup on unmount
		return () => cancelAnimationFrame(id)
	}, [queryClient])
}
