import {useRef, useEffect} from 'react'
import {useSyncStatus} from '@/hooks/useSyncStatus'
import {syncStage} from '@/lib/sync-progress'

// Hook to track sync progress without re-renders
export function useSyncProgress() {
	const {data: syncStatus} = useSyncStatus()
	const currentHeightRef = useRef(0)
	const targetHeightRef = useRef(0)
	const lastUpdateRef = useRef(0)

	useEffect(() => {
		if (syncStatus?.blockHeight) {
			targetHeightRef.current = syncStatus.blockHeight
		}
	}, [syncStatus?.blockHeight])

	// Return refs so AnimatedCube can read them in useFrame
	return {
		currentHeightRef,
		targetHeightRef,
		lastUpdateRef,
		stage: syncStage(syncStatus),
		syncStatus,
	}
}
