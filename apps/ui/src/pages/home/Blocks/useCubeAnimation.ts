import {useState, useCallback} from 'react'
import type {CubeAnimationState} from './types'

// Hook to manage cube animation state
export function useCubeAnimation(_index: number, _baseX: number) {
	const [animationState, setAnimationState] = useState<CubeAnimationState>({
		phase: 'idle',
		startTime: 0,
	})

	const startEntering = useCallback((time: number) => {
		setAnimationState({
			phase: 'entering',
			startTime: time,
			enteringSubPhase: 'spinning-in',
		})
	}, [])

	const startSliding = useCallback((time: number, from: number, to: number) => {
		setAnimationState({
			phase: 'sliding',
			startTime: time,
			slideFrom: from,
			slideTo: to,
		})
	}, [])

	const startExiting = useCallback((time: number, from: number, to: number) => {
		setAnimationState({
			phase: 'exiting',
			startTime: time,
			slideFrom: from,
			slideTo: to,
		})
	}, [])

	const reset = useCallback(() => {
		setAnimationState({
			phase: 'idle',
			startTime: 0,
		})
	}, [])

	return {
		animationState,
		startEntering,
		startSliding,
		startExiting,
		reset,
	}
}
