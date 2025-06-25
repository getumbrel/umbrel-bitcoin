import type {BlockSummary, SyncStatus} from '#types'
import type {SyncStage} from '@/lib/sync-progress'

// Animation phases
export type AnimationPhase = 'idle' | 'entering' | 'sliding' | 'exiting'
export type EnteringSubPhase = 'spinning-in' | 'validating' | 'verified' | 'spinning-to-front' | 'complete'

// Animation state
export interface CubeAnimationState {
	phase: AnimationPhase
	startTime: number
	enteringSubPhase?: EnteringSubPhase
	slideFrom?: number
	slideTo?: number
}

// Component props
export interface AnimatedCubeProps {
	index: number
	baseX: number
	block?: BlockSummary
	isLoading: boolean
	animationState: CubeAnimationState
	onAnimationComplete?: () => void
	globalMouse: {x: number; y: number}
	syncProgress?: {
		currentHeightRef: React.MutableRefObject<number>
		targetHeightRef: React.MutableRefObject<number>
		lastUpdateRef: React.MutableRefObject<number>
		stage: SyncStage
		syncStatus?: SyncStatus
	}
}

// Cube data structure
export interface CubeData {
	key: string
	block?: BlockSummary
	animationState: CubeAnimationState
}
