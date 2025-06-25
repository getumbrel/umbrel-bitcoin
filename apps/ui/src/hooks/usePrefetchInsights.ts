import {useEffect} from 'react'
import {useQueryClient} from '@tanstack/react-query'

import type {BlockReward, BlockSizeSample, FeeRatePoint, Stats} from '#types'
import type {PeerInfo} from '#types'

import {api} from '@/lib/api'

const NUM_BLOCKS = 200

export function usePrefetchInsights() {
	const queryClient = useQueryClient()

	useEffect(() => {
		const prefetch = () => {
			queryClient.prefetchQuery({
				queryKey: ['rpc', 'stats'],
				queryFn: () => api<Stats>('/rpc/stats'),
			})
			queryClient.prefetchQuery({
				queryKey: ['rpc', 'blocks', 'rewards', NUM_BLOCKS],
				queryFn: () => api<BlockReward[]>(`/rpc/blocks/rewards?limit=${NUM_BLOCKS}`),
			})
			queryClient.prefetchQuery({
				queryKey: ['rpc', 'blocks', 'size', NUM_BLOCKS],
				queryFn: () => api<BlockSizeSample[]>(`/rpc/blocks/size?limit=${NUM_BLOCKS}`),
			})
			queryClient.prefetchQuery({
				queryKey: ['rpc', 'blocks', 'fees', NUM_BLOCKS],
				queryFn: () => api<FeeRatePoint[]>(`/rpc/blocks/fees?limit=${NUM_BLOCKS}`),
			})
			queryClient.prefetchQuery({
				queryKey: ['rpc', 'peers', 'info'],
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
