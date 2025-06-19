import {useState, useEffect, useRef} from 'react'
import {useThree} from '@react-three/fiber'

import {useSyncStatus} from '@/hooks/useSyncStatus'
import {syncStage} from '@/lib/sync-progress'
import {useLatestBlocks} from '@/hooks/useLatestBlocks'

import {AnimatedCube} from './AnimatedCube'
import {useGlobalMouse} from './useGlobalMouse'
import {useSyncProgress} from './useSyncProgress'
import {DISPLAY_CONFIG} from './display.config'
import {ANIMATION_CONFIG} from './animation.config'

import type {BlockSummary} from '#types'
import type {CubeData} from './types'

export function Scene() {
	const {clock} = useThree()
	const [cubes, setCubes] = useState<CubeData[]>([])
	const prevBlocksRef = useRef<BlockSummary[]>([])
	const globalMouse = useGlobalMouse()
	const syncProgress = useSyncProgress()

	// Sync status and blocks
	const {data: syncStatus} = useSyncStatus()
	const stage = syncStage(syncStatus)
	const {data: blocks = [], isLoading: isLoadingBlocks} = useLatestBlocks({stage})
	const isLoading = stage === 'pre-headers' || stage === 'headers' || stage === 'IBD' || isLoadingBlocks

	// Initialize cubes
	useEffect(() => {
		if (cubes.length === 0) {
			setCubes(
				Array.from({length: DISPLAY_CONFIG.MAX_CUBES}, (_, i) => ({
					key: `initial-${i}`,
					block: blocks[i],
					animationState: {phase: 'idle', startTime: 0},
				})),
			)
		}
	}, [cubes.length, blocks])

	// Handle new blocks
	useEffect(() => {
		if (isLoading || blocks.length === 0) return

		// Check for new block
		const hasNewBlock = prevBlocksRef.current.length > 0 && blocks[0]?.height !== prevBlocksRef.current[0]?.height

		if (hasNewBlock) {
			const currentTime = clock.elapsedTime

			setCubes((prevCubes) => {
				const newCubes: CubeData[] = []

				// Add new entering block
				newCubes.push({
					key: `block-${blocks[0].height}-${currentTime}`,
					block: blocks[0],
					animationState: {phase: 'entering' as const, startTime: currentTime},
				})

				// Update existing cubes to slide
				prevCubes.forEach((cube, i) => {
					if (i < DISPLAY_CONFIG.MAX_CUBES - 1) {
						// Slide to next position
						const fromX = (i - 2) * (DISPLAY_CONFIG.CUBE_SIZE + DISPLAY_CONFIG.GAP)
						const toX = (i + 1 - 2) * (DISPLAY_CONFIG.CUBE_SIZE + DISPLAY_CONFIG.GAP)

						newCubes.push({
							...cube,
							animationState: {
								phase: 'sliding' as const,
								startTime: currentTime,
								slideFrom: fromX,
								slideTo: toX,
							},
						})
					} else if (i === DISPLAY_CONFIG.MAX_CUBES - 1) {
						// Last cube exits
						const fromX = (i - 2) * (DISPLAY_CONFIG.CUBE_SIZE + DISPLAY_CONFIG.GAP)
						const toX = (i + 1 - 2) * (DISPLAY_CONFIG.CUBE_SIZE + DISPLAY_CONFIG.GAP)

						newCubes.push({
							...cube,
							animationState: {
								phase: 'exiting' as const,
								startTime: currentTime,
								slideFrom: fromX,
								slideTo: toX,
							},
						})
					}
				})

				return newCubes
			})

			// Clean up after animations complete
			setTimeout(() => {
				setCubes((prevCubes) => {
					// Remove exiting cubes and reset animations
					return prevCubes
						.filter((cube) => cube.animationState.phase !== 'exiting')
						.slice(0, DISPLAY_CONFIG.MAX_CUBES)
						.map((cube, i) => ({
							...cube,
							block: blocks[i],
							animationState: {phase: 'idle', startTime: 0},
						}))
				})
			}, ANIMATION_CONFIG.NEW_BLOCK_DURATION * 1000)
		}

		prevBlocksRef.current = [...blocks]
	}, [blocks, isLoading, clock])

	// Update blocks data for non-animating cubes
	useEffect(() => {
		if (!isLoading && blocks.length > 0) {
			setCubes((prevCubes) =>
				prevCubes.map((cube, i) => {
					// Only update block data if not animating
					if (cube.animationState.phase === 'idle' && blocks[i]) {
						return {...cube, block: blocks[i]}
					}
					return cube
				}),
			)
		}
	}, [blocks, isLoading])

	// Render cubes
	return (
		<>
			<ambientLight intensity={0.8} />
			<directionalLight position={[5, 8, 3]} intensity={1.5} />

			{(isLoading ? Array.from({length: DISPLAY_CONFIG.MAX_CUBES}) : cubes).map((cube, index) => {
				const baseX = (index - 2) * (DISPLAY_CONFIG.CUBE_SIZE + DISPLAY_CONFIG.GAP)

				return (
					<AnimatedCube
						key={isLoading ? `loading-${index}` : (cube as CubeData).key}
						index={index}
						baseX={baseX}
						block={isLoading ? undefined : (cube as CubeData)?.block}
						isLoading={isLoading}
						animationState={
							isLoading
								? {phase: 'idle', startTime: 0}
								: (cube as CubeData)?.animationState || {phase: 'idle', startTime: 0}
						}
						globalMouse={globalMouse}
						syncProgress={syncProgress}
					/>
				)
			})}
		</>
	)
}
