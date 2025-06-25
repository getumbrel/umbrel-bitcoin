import {useRef, useState, useEffect, useMemo} from 'react'
import * as THREE from 'three'
import {useFrame, useThree} from '@react-three/fiber'
import {RoundedBox, Text} from '@react-three/drei'
import {configureTextBuilder} from 'troika-three-text'
import prettyBytes from 'pretty-bytes'
import prettyMs from 'pretty-ms'

import {Transactions} from './Transactions'
import {createLiquidMaterial} from './liquidMaterial'
import {DISPLAY_CONFIG} from './display.config'
import {ANIMATION_CONFIG} from './animation.config'
import {easings} from './easings'

import type {AnimatedCubeProps, AnimationPhase, EnteringSubPhase} from './types'

// Configure troika-three-text for tight CSP compliance:
// We disable web workers to avoid having to loosen the CSP for blobs
// Each Text component uses font="/roboto-regular.ttf" (locally hosted) instead of
// defaulting to reaching out to jsDelivr CDN for a font.
configureTextBuilder({
	useWorker: false,
})

export function AnimatedCube({
	index,
	baseX,
	block,
	isLoading,
	animationState,
	onAnimationComplete,
	globalMouse,
	syncProgress,
}: AnimatedCubeProps) {
	const groupRef = useRef<THREE.Group>(null!)
	const meshRef = useRef<THREE.Mesh>(null!)
	const facePlaneRef = useRef<THREE.Mesh>(null!)
	const [isHovered, setIsHovered] = useState(false)
	const liquidMaterial = useMemo(() => createLiquidMaterial(), [])

	const {clock} = useThree()

	// Animation values
	const position = useRef({x: baseX, y: 0})
	const rotation = useRef({x: 0, y: 0, z: 0})
	const scale = useRef(1)
	const opacity = useRef(1)
	const materialBlend = useRef(0)
	const prevPhaseRef = useRef<AnimationPhase | null>(null)
	const mouseRef = useRef({x: 0, y: 0})
	const enteringSubPhaseRef = useRef<EnteringSubPhase>('spinning-in')
	const [displaySubPhase, setDisplaySubPhase] = useState<EnteringSubPhase>('spinning-in')
	const frontContentGroupRef = useRef<THREE.Group>(null!)

	// Loading state refs
	const displayHeightRef = useRef(0)
	const loadingLiquidOpacityRef = useRef(0)

	// Initialize display height from sync progress
	useEffect(() => {
		if (syncProgress && syncProgress.targetHeightRef.current > 0) {
			displayHeightRef.current = syncProgress.targetHeightRef.current
			syncProgress.currentHeightRef.current = syncProgress.targetHeightRef.current
		}
	}, [syncProgress])

	// Update mouse ref whenever globalMouse changes
	useEffect(() => {
		mouseRef.current = globalMouse
	}, [globalMouse])

	// Reset animation values when phase changes
	useEffect(() => {
		// Only reset if phase actually changed
		if (prevPhaseRef.current === animationState.phase) return

		prevPhaseRef.current = animationState.phase

		if (animationState.phase === 'entering') {
			// Reset for entering animation
			scale.current = 0
			opacity.current = 0
			rotation.current.y = Math.PI + mouseRef.current.x * ANIMATION_CONFIG.MAX_ROTATION // Back face + current mouse rotation
			rotation.current.x = -mouseRef.current.y * ANIMATION_CONFIG.MAX_ROTATION // Apply current mouse X rotation
			rotation.current.z = 0 // Reset Z rotation
			position.current.x = baseX
			position.current.y = 0
			materialBlend.current = 0
			enteringSubPhaseRef.current = 'spinning-in'
			setDisplaySubPhase('spinning-in')
		} else if (animationState.phase === 'idle') {
			// Reset to default values
			scale.current = 1
			opacity.current = 1
			rotation.current.y = mouseRef.current.x * ANIMATION_CONFIG.MAX_ROTATION // Apply current mouse rotation
			rotation.current.x = -mouseRef.current.y * ANIMATION_CONFIG.MAX_ROTATION
			rotation.current.z = 0 // Reset Z rotation
			position.current.x = baseX
			position.current.y = 0
			materialBlend.current = 0
			enteringSubPhaseRef.current = 'spinning-in'
			setDisplaySubPhase('spinning-in')
		}
	}, [animationState.phase, baseX]) // Only run when phase or baseX changes, not mouse movement

	useFrame((_, delta) => {
		if (!groupRef.current) return

		const now = clock.elapsedTime
		const elapsed = now - animationState.startTime

		// Target values
		let targetX = baseX
		let targetY = 0
		let targetScale = isHovered ? 1.05 : 1.0
		let targetOpacity = 1.0
		let targetRotationY = 0

		// Handle different animation phases
		switch (animationState.phase) {
			case 'idle':
				// Loading wave animation
				if (isLoading) {
					// Breathing effect for wave amplitude
					const breathingFactor = 1 + 0.3 * Math.sin(now * ANIMATION_CONFIG.WAVE_BREATHING_SPEED)

					// Base wave with enhanced motion
					const waveCycle =
						ANIMATION_CONFIG.WAVE_DELAY * (DISPLAY_CONFIG.MAX_CUBES - 1) +
						ANIMATION_CONFIG.BOUNCE_DURATION +
						ANIMATION_CONFIG.PAUSE_AFTER_WAVE
					const cycleT = now % waveCycle
					const startT = index * ANIMATION_CONFIG.WAVE_DELAY
					const endT = startT + ANIMATION_CONFIG.BOUNCE_DURATION

					if (cycleT >= startT && cycleT <= endT) {
						const progress = (cycleT - startT) / ANIMATION_CONFIG.BOUNCE_DURATION
						const sineWave = Math.sin(progress * Math.PI)
						targetY = ANIMATION_CONFIG.WAVE_AMPLITUDE * sineWave * breathingFactor
					} else {
						// Keep blocks at rest when not in main wave
						targetY = 0
					}

					// Update block counter animation
					if (syncProgress && syncProgress.stage === 'IBD') {
						const targetHeight = syncProgress.targetHeightRef.current
						const currentHeight = syncProgress.currentHeightRef.current
						const timeSinceLastUpdate = now - syncProgress.lastUpdateRef.current

						// Animate block count
						if (currentHeight < targetHeight) {
							const blocksToAdd = Math.min(
								Math.ceil(ANIMATION_CONFIG.BLOCK_COUNT_SPEED * timeSinceLastUpdate),
								targetHeight - currentHeight,
							)
							displayHeightRef.current = currentHeight + blocksToAdd
							syncProgress.currentHeightRef.current = displayHeightRef.current
							syncProgress.lastUpdateRef.current = now
						} else {
							displayHeightRef.current = targetHeight
						}
					}

					// Liquid effect opacity for loading state
					if (syncProgress && (syncProgress.stage === 'IBD' || syncProgress.stage === 'headers')) {
						loadingLiquidOpacityRef.current = Math.min(
							loadingLiquidOpacityRef.current + delta * 2,
							ANIMATION_CONFIG.LOADING_LIQUID_OPACITY,
						)
					} else if (syncProgress && syncProgress.stage === 'pre-headers') {
						loadingLiquidOpacityRef.current = Math.min(
							loadingLiquidOpacityRef.current + delta * 2,
							ANIMATION_CONFIG.LOADING_LIQUID_OPACITY * 0.7,
						)
					}
				} else {
					// Fade out loading effects when not loading
					loadingLiquidOpacityRef.current = Math.max(loadingLiquidOpacityRef.current - delta * 3, 0)
				}
				break

			case 'entering': {
				const adjustedElapsed = Math.max(0, elapsed - ANIMATION_CONFIG.ENTRANCE_DELAY)

				// Determine sub-phase
				const spinInDuration = 0.8
				const validationStart = spinInDuration + 0.2
				const verifiedStart = validationStart + ANIMATION_CONFIG.VALIDATION_DURATION
				const spinToFrontStart = verifiedStart + 0.3

				let subPhase: EnteringSubPhase = 'spinning-in'
				if (adjustedElapsed >= spinToFrontStart + ANIMATION_CONFIG.SPIN_TO_FRONT_DURATION) {
					subPhase = 'complete'
				} else if (adjustedElapsed >= spinToFrontStart) {
					subPhase = 'spinning-to-front'
				} else if (adjustedElapsed >= verifiedStart) {
					subPhase = 'verified'
				} else if (adjustedElapsed >= validationStart) {
					subPhase = 'validating'
				}

				// Update sub-phase tracking
				if (enteringSubPhaseRef.current !== subPhase) {
					enteringSubPhaseRef.current = subPhase
					setDisplaySubPhase(subPhase)
				}

				// Apply animations based on sub-phase
				switch (subPhase) {
					case 'spinning-in': {
						const progress = adjustedElapsed / spinInDuration
						const eased = easings.outExpo(progress)
						targetScale = eased
						targetRotationY = Math.PI
						targetY = Math.sin(eased * Math.PI) * 0.5
						targetOpacity = eased
						targetX = baseX - (1 - eased) * 0.5
						materialBlend.current = 1 - eased
						break
					}
					case 'validating':
					case 'verified':
						targetRotationY = Math.PI
						materialBlend.current = subPhase === 'verified' ? 0.8 : 0
						break
					case 'spinning-to-front': {
						const progress = (adjustedElapsed - spinToFrontStart) / ANIMATION_CONFIG.SPIN_TO_FRONT_DURATION
						const clampedProgress = Math.min(progress, 1) // Ensure we don't exceed 1
						const eased = easings.outExpo(clampedProgress) // Smoother deceleration at the end
						targetRotationY = Math.PI * (1 - eased)
						materialBlend.current = 0.8 * (1 - eased)
						break
					}
					case 'complete':
						targetRotationY = 0 // Ensure we're at the front face
						materialBlend.current = 0
						if (onAnimationComplete) {
							onAnimationComplete()
						}
						break
				}
				break
			}

			case 'sliding': {
				const cascadeDelay = index * ANIMATION_CONFIG.CASCADE_DELAY
				const adjustedElapsed = Math.max(0, elapsed - cascadeDelay)
				const progress = Math.min(adjustedElapsed / ANIMATION_CONFIG.SLIDE_DURATION, 1)
				const eased = easings.outQuint(progress)

				targetX = animationState.slideFrom! + (animationState.slideTo! - animationState.slideFrom!) * eased

				// Impact effect
				if (adjustedElapsed < ANIMATION_CONFIG.IMPACT_DURATION) {
					const impactProgress = adjustedElapsed / ANIMATION_CONFIG.IMPACT_DURATION
					targetScale *=
						ANIMATION_CONFIG.IMPACT_SCALE + (1 - ANIMATION_CONFIG.IMPACT_SCALE) * easings.outBack(impactProgress)
				}
				break
			}

			case 'exiting': {
				const cascadeDelay = index * ANIMATION_CONFIG.CASCADE_DELAY
				const adjustedElapsed = Math.max(0, elapsed - cascadeDelay)
				const progress = Math.min(adjustedElapsed / ANIMATION_CONFIG.SLIDE_DURATION, 1)
				const eased = easings.outQuint(progress)

				targetX = animationState.slideFrom! + (animationState.slideTo! - animationState.slideFrom!) * eased
				targetOpacity = 1 - eased
				break
			}
		}

		// Smooth transitions
		const lerpFactor = 1 - Math.pow(0.01, delta)
		position.current.x += (targetX - position.current.x) * lerpFactor
		position.current.y += (targetY - position.current.y) * lerpFactor
		scale.current += (targetScale - scale.current) * lerpFactor
		opacity.current += (targetOpacity - opacity.current) * lerpFactor

		// Mouse tracking rotation
		const mouseRotationY = globalMouse.x * ANIMATION_CONFIG.MAX_ROTATION + targetRotationY
		const mouseRotationX = -globalMouse.y * ANIMATION_CONFIG.MAX_ROTATION

		// For entering animations, apply rotation directly to avoid lag
		if (animationState.phase === 'entering') {
			// Snap to target when very close to prevent micro-jumps
			if (Math.abs(mouseRotationY) < 0.001) {
				rotation.current.y = 0
			} else {
				rotation.current.y = mouseRotationY
			}
			rotation.current.x = mouseRotationX
		} else {
			// Smooth rotation for all other cases
			rotation.current.y += (mouseRotationY - rotation.current.y) * ANIMATION_CONFIG.FOLLOW_SPEED
			rotation.current.x += (mouseRotationX - rotation.current.x) * ANIMATION_CONFIG.FOLLOW_SPEED
		}

		// Apply transforms
		groupRef.current.position.x = position.current.x
		groupRef.current.position.y = position.current.y
		groupRef.current.rotation.x = rotation.current.x
		groupRef.current.rotation.y = rotation.current.y
		groupRef.current.rotation.z = rotation.current.z
		groupRef.current.scale.setScalar(scale.current)

		// Update materials
		if (meshRef.current) {
			const material = meshRef.current.material as THREE.MeshStandardMaterial
			material.opacity = opacity.current

			// Material effects for entering animation
			if (animationState.phase === 'entering') {
				if (enteringSubPhaseRef.current === 'verified' || enteringSubPhaseRef.current === 'spinning-to-front') {
					// Green verification effect with smooth transition
					const greenIntensity = materialBlend.current

					// Smoothly interpolate material properties
					material.metalness = 0.8 + 0.15 * greenIntensity
					material.roughness = 0.5 - 0.4 * greenIntensity

					// Smooth color transition from gray to green-tinted and back
					const baseGray = 0.8
					const greenTint = greenIntensity * 0.15
					material.color = new THREE.Color(
						baseGray - greenTint * 0.2, // Less red
						baseGray + greenTint * 0.2, // More green
						baseGray - greenTint * 0.1, // Slightly less blue
					)

					// Smooth emissive transition
					if (greenIntensity > 0) {
						// Interpolate emissive color from dark gray to green
						const emissiveR = 0.1 * greenIntensity * 0
						const emissiveG = 0.1 * greenIntensity * 1
						const emissiveB = 0.1 * greenIntensity * 0.267
						material.emissive = new THREE.Color(emissiveR, emissiveG, emissiveB)
						material.emissiveIntensity = greenIntensity * 0.3
					} else {
						material.emissive = new THREE.Color(0x000000)
						material.emissiveIntensity = 0
					}
				} else if (materialBlend.current > 0) {
					// Entrance glow
					material.metalness = 0.8 + 0.2 * materialBlend.current
					material.roughness = 0.5 - 0.3 * materialBlend.current
					material.color = new THREE.Color(0xcccccc)
					material.emissive = new THREE.Color(0xcccccc)
					material.emissiveIntensity = materialBlend.current * 0.1
				} else {
					// Default during entering but not glowing
					material.metalness = 0.8
					material.roughness = 0.5
					material.color = new THREE.Color(0xcccccc)
					material.emissive = new THREE.Color(0x000000)
					material.emissiveIntensity = 0
				}
			} else {
				// Default material for non-entering phases
				material.metalness = 0.8
				material.roughness = 0.5
				material.color = new THREE.Color(0xcccccc)
				material.emissive = new THREE.Color(0x000000)
				material.emissiveIntensity = 0
			}
		}

		if (facePlaneRef.current) {
			const material = facePlaneRef.current.material as THREE.MeshStandardMaterial
			material.opacity = opacity.current * 0.8
		}

		// Update front content opacity during exit
		if (frontContentGroupRef.current) {
			// Set group visibility based on opacity
			frontContentGroupRef.current.visible = opacity.current > 0.01
			// Apply opacity to the group's render order
			frontContentGroupRef.current.traverse((child) => {
				if (child instanceof THREE.Mesh && child.material) {
					const material = child.material as any
					if (material.transparent !== undefined) {
						material.transparent = true
						material.opacity = opacity.current
					}
					// Handle shader materials with opacity uniform
					if (material.uniforms && material.uniforms.opacity) {
						material.uniforms.opacity.value = opacity.current
					}
				}
			})
		}

		// Update liquid shader
		liquidMaterial.uniforms['uTime'].value = now

		if (animationState.phase === 'entering') {
			const subPhase = enteringSubPhaseRef.current
			if (subPhase === 'spinning-in' || subPhase === 'validating') {
				liquidMaterial.uniforms['uOpacity'].value = Math.min(liquidMaterial.uniforms['uOpacity'].value + delta * 3, 0.8)
				liquidMaterial.uniforms['uColorProgress'].value = 0
			} else if (subPhase === 'verified' || subPhase === 'spinning-to-front') {
				liquidMaterial.uniforms['uColorProgress'].value = Math.min(
					liquidMaterial.uniforms['uColorProgress'].value + delta * 3,
					1.0,
				)
				if (subPhase === 'spinning-to-front') {
					liquidMaterial.uniforms['uOpacity'].value = Math.max(liquidMaterial.uniforms['uOpacity'].value - delta * 2, 0)
				}
			} else {
				liquidMaterial.uniforms['uOpacity'].value = Math.max(liquidMaterial.uniforms['uOpacity'].value - delta * 2, 0)
			}
		} else if (isLoading && loadingLiquidOpacityRef.current > 0) {
			// Loading state liquid effect
			liquidMaterial.uniforms['uOpacity'].value = loadingLiquidOpacityRef.current
			liquidMaterial.uniforms['uColorProgress'].value = 0 // Keep it orange/red for loading
		} else {
			liquidMaterial.uniforms['uOpacity'].value = 0
			liquidMaterial.uniforms['uColorProgress'].value = 0
		}
	})

	const faceSize = DISPLAY_CONFIG.CUBE_SIZE - DISPLAY_CONFIG.BEVEL * 2 - DISPLAY_CONFIG.FACE_GAP * 2

	return (
		<group ref={groupRef} onPointerEnter={() => setIsHovered(true)} onPointerLeave={() => setIsHovered(false)}>
			{/* Main cube */}
			<RoundedBox
				ref={meshRef}
				args={[DISPLAY_CONFIG.CUBE_SIZE, DISPLAY_CONFIG.CUBE_SIZE, 1.5]}
				radius={DISPLAY_CONFIG.BEVEL}
				smoothness={4}
			>
				<meshStandardMaterial color='#cccccc' metalness={0.8} roughness={0.5} transparent />
			</RoundedBox>

			{/* Front face and content group - rotates as one unit */}
			{!isLoading && (
				<group ref={frontContentGroupRef}>
					{/* Front face */}
					<mesh ref={facePlaneRef} position={[0, 0, DISPLAY_CONFIG.PLANE_Z]}>
						<planeGeometry args={[faceSize, faceSize]} />
						<meshStandardMaterial color='#000' transparent opacity={0.8} />
					</mesh>

					{/* Front content */}
					<Transactions faceSize={faceSize} planeZ={DISPLAY_CONFIG.PLANE_Z} isHovered={isHovered} block={block} />

					{block && (
						<>
							<Text
								position={[-1.2, -0.8, DISPLAY_CONFIG.PLANE_Z + 0.02]}
								fontSize={0.3}
								color='#ffffff'
								anchorX='left'
								anchorY='bottom'
								material-transparent={true}
								font='/roboto-regular.ttf'
							>
								{block.height?.toLocaleString() ?? '—'}
							</Text>
							<Text
								position={[-1.2, -1.1, DISPLAY_CONFIG.PLANE_Z + 0.02]}
								fontSize={0.2}
								color='#aaaaaa'
								anchorX='left'
								anchorY='bottom'
								material-transparent={true}
								font='/roboto-regular.ttf'
							>
								{typeof block.size === 'number' ? prettyBytes(block.size) : '—'} •{' '}
								{typeof block.time === 'number'
									? `${prettyMs(Date.now() - block.time * 1000, {compact: true, unitCount: 1})} ago`
									: '—'}
							</Text>
						</>
					)}
				</group>
			)}

			{/* Back face and content group - rotates as one unit */}
			{!isLoading && animationState.phase === 'entering' && (
				<group rotation={[0, Math.PI, 0]}>
					{/* Back face */}
					<mesh position={[0, 0, DISPLAY_CONFIG.PLANE_Z]}>
						<planeGeometry args={[faceSize, faceSize]} />
						<meshStandardMaterial color='#000' transparent opacity={0.8} />
					</mesh>

					{/* Liquid effect */}
					<mesh position={[0, 0, DISPLAY_CONFIG.PLANE_Z + 0.03]}>
						<planeGeometry args={[faceSize * 0.9, faceSize * 0.9]} />
						<primitive object={liquidMaterial} attach='material' />
					</mesh>

					{/* Validation text - always show during entering phase */}
					<>
						<Text
							position={[-1.2, -0.8, DISPLAY_CONFIG.PLANE_Z + 0.02]}
							fontSize={0.3}
							color={displaySubPhase === 'verified' || displaySubPhase === 'spinning-to-front' ? '#00ff00' : '#ffffff'}
							anchorX='left'
							anchorY='bottom'
							font='/roboto-regular.ttf'
						>
							{block?.height?.toLocaleString() ?? '—'}
						</Text>
						<Text
							position={[1.2, 1.2, DISPLAY_CONFIG.PLANE_Z + 0.02]}
							fontSize={0.2}
							color='#ffffff'
							anchorX='right'
							anchorY='top'
							font='/roboto-regular.ttf'
						>
							{displaySubPhase === 'verified' || displaySubPhase === 'spinning-to-front'
								? 'Validated'
								: 'Validating...'}
						</Text>
						<Text
							position={[-1.2, -1.1, DISPLAY_CONFIG.PLANE_Z + 0.02]}
							fontSize={0.2}
							color='#aaaaaa'
							anchorX='left'
							anchorY='bottom'
							font='/roboto-regular.ttf'
						>
							New Block
						</Text>
					</>
				</group>
			)}

			{/* Loading face - shows during sync */}
			{isLoading && syncProgress && (
				<>
					{/* Loading face */}
					<mesh position={[0, 0, DISPLAY_CONFIG.PLANE_Z]}>
						<planeGeometry args={[faceSize, faceSize]} />
						<meshStandardMaterial color='#000' transparent opacity={0.8} />
					</mesh>

					{/* Liquid effect */}
					{loadingLiquidOpacityRef.current > 0 && (
						<mesh position={[0, 0, DISPLAY_CONFIG.PLANE_Z + 0.03]}>
							<planeGeometry args={[faceSize * 0.9, faceSize * 0.9]} />
							<primitive object={liquidMaterial} attach='material' />
						</mesh>
					)}

					{/* Loading text based on sync stage
					{syncProgress.stage === 'headers' && (
						<Text
							position={[0, 0, DISPLAY_CONFIG.PLANE_Z + 0.02]}
							fontSize={0.25}
							color='#ffffff'
							anchorX='center'
							anchorY='middle'
							font='/roboto-regular.ttf'
						>
							Synchronizing headers
						</Text>
					)} */}

					{syncProgress.stage === 'IBD' && (
						<>
							<Text
								position={[-1.2, -0.8, DISPLAY_CONFIG.PLANE_Z + 0.02]}
								fontSize={0.3}
								color='#ffffff'
								anchorX='left'
								anchorY='bottom'
								font='/roboto-regular.ttf'
							>
								{Math.floor(Math.max(0, displayHeightRef.current - index)).toLocaleString()}
							</Text>
							{syncProgress.syncStatus?.validatedHeaderHeight && (
								<Text
									position={[-1.2, -1.1, DISPLAY_CONFIG.PLANE_Z + 0.02]}
									fontSize={0.2}
									color='#aaaaaa'
									anchorX='left'
									anchorY='bottom'
									font='/roboto-regular.ttf'
								>
									Block
								</Text>
							)}
						</>
					)}
				</>
			)}
		</group>
	)
}
