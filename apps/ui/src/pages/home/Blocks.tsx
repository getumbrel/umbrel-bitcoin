// TODOS:
// - proper loading state
// - destroy canvas properly when unmounting
// - add an IBD animation
// - add a new block animation
// - add testris-cube component
// - tweak material parameters and lighting to get closer to Suj's design

import {useRef, useState, useEffect} from 'react'
import * as THREE from 'three'
import {Canvas, useFrame} from '@react-three/fiber'
import {RoundedBox} from '@react-three/drei'
import {Text} from '@react-three/drei'
import prettyBytes from 'pretty-bytes'
import prettyMs from 'pretty-ms'

import {useBlocks} from '@/hooks/useBlocks'
import type {BlockSummary} from '@umbrel-bitcoin/shared-types'

// Parameters for cube dimensions and spacing
const MAX_NUM_CUBES = 5
const CUBE_SIZE = 2.8
const GAP_BETWEEN_CUBES = 0.15

// Parameters to control how the cubes rotate and follow the mouse
const MAX_ROTATION = 0.15
const FOLLOW_SPEED = 0.05

// Parameters to control the bounce and delay between cubes
const AMPLITUDE = 0.2 // how high every cube hops
const CUBE_DELAY_SEC = 0.2 // time between one cube animation start and the next
const BOUNCE_DURATION_SEC = 0.4 // time a single cube spends doing its hop motion
const PAUSE_AFTER_WAVE_SEC = 0.2 // time to sit still after the last cube lands
const CYCLE = (MAX_NUM_CUBES - 1) * CUBE_DELAY_SEC + BOUNCE_DURATION_SEC + PAUSE_AFTER_WAVE_SEC

// Global mouse tracking
function useGlobalMouse() {
	const [mouse, setMouse] = useState({x: 0, y: 0})

	useEffect(() => {
		const handleMouseMove = (event: MouseEvent) => {
			// We check if mouse is within viewport bounds and reset the blocks back to neutral position
			// if the user's mouse is no longer in the browser window
			if (
				event.clientX >= 0 &&
				event.clientX <= window.innerWidth &&
				event.clientY >= 0 &&
				event.clientY <= window.innerHeight
			) {
				const x = (event.clientX / window.innerWidth) * 2 - 1
				const y = -(event.clientY / window.innerHeight) * 2 + 1
				setMouse({x, y})
			} else {
				// Mouse is outside viewport, reset to neutral
				setMouse({x: 0, y: 0})
			}
		}

		const handleMouseLeave = () => {
			setMouse({x: 0, y: 0})
		}

		document.addEventListener('mousemove', handleMouseMove)
		document.addEventListener('mouseleave', handleMouseLeave)
		return () => {
			document.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseleave', handleMouseLeave)
		}
	}, [])

	return mouse
}

// Single cube + front-plane for block data
const BEVEL = 0.03
const FACE_GAP = 0.01 // Use to shrink the front-plane to see the bevels
const PLANE_Z = 1.5 / 2 + 0.001 // flush + 1 mm to avoid z-fight

function Cube({
	index,
	baseX,
	globalMouse,
	loading,
	block,
}: {
	index: number
	baseX: number
	globalMouse: {x: number; y: number}
	loading: boolean
	block?: BlockSummary | undefined
}) {
	const group = useRef<THREE.Group>(null!)
	const facePlane = useRef<THREE.Mesh>(null!)

	useFrame(({clock}) => {
		if (!group.current) return

		group.current.position.x = baseX

		const ry = globalMouse.x * MAX_ROTATION
		const rx = -globalMouse.y * MAX_ROTATION
		group.current.rotation.y += (ry - group.current.rotation.y) * FOLLOW_SPEED
		group.current.rotation.x += (rx - group.current.rotation.x) * FOLLOW_SPEED

		// Propagating wave while loading
		if (loading) {
			const t = clock.elapsedTime

			// Where are we in the cycle? 0 … CYCLE seconds, then it wraps
			const cycleT = t % CYCLE

			// When this cube's personal bounce starts
			const startT = index * CUBE_DELAY_SEC
			const endT = startT + BOUNCE_DURATION_SEC

			if (cycleT >= startT && cycleT <= endT) {
				// Normalised 0 → π gives smooth up-and-down
				const local = (cycleT - startT) / BOUNCE_DURATION_SEC
				group.current.position.y = AMPLITUDE * Math.sin(local * Math.PI)
			} else {
				group.current.position.y = 0
			}
		} else {
			group.current.position.y = 0
		}
	})

	// The front face = cube width minus two bevels & the gap
	const faceSize = CUBE_SIZE - BEVEL * 2 - FACE_GAP * 2

	return (
		<group ref={group}>
			{/* Roundedcube */}
			<RoundedBox args={[CUBE_SIZE, CUBE_SIZE, 1.5]} radius={BEVEL} smoothness={4}>
				<meshStandardMaterial color='#cccccc' metalness={0.8} roughness={0.5} />
			</RoundedBox>

			{/* darker edges for the bevels */}
			{/* <RoundedBox args={[CUBE_SIZE, CUBE_SIZE, 1.5]} radius={BEVEL} smoothness={2}>
				<meshBasicMaterial color='#444' wireframe opacity={0.2} />
			</RoundedBox> */}

			{/* Front-face for block data */}
			{!loading && (
				<mesh ref={facePlane} position={[0, 0, PLANE_Z]}>
					<planeGeometry args={[faceSize, faceSize]} />
					<meshStandardMaterial color='#222' transparent={true} opacity={1} metalness={0.8} roughness={0.5} />
				</mesh>
			)}

			{block && !loading && (
				<>
					<Text
						position={[-1.2, -0.8, PLANE_Z + 0.02]}
						fontSize={0.3}
						color='#ffffff'
						anchorX='left'
						anchorY='bottom'
						material-metalness={0.2}
						material-roughness={0.8}
					>
						{block.height?.toLocaleString() ?? '—'}
					</Text>
					<Text
						position={[-1.2, -1.1, PLANE_Z + 0.02]}
						fontSize={0.2}
						color='#aaaaaa'
						anchorX='left'
						anchorY='bottom'
						material-metalness={0.1}
						material-roughness={0.8}
					>
						{typeof block.size === 'number' ? prettyBytes(block.size) : '—'} •{' '}
						{typeof block.time === 'number'
							? `${prettyMs(Date.now() - block.time * 1000, {compact: true, unitCount: 1})} ago`
							: '—'}
					</Text>
				</>
			)}
		</group>
	)
}

// The full scene with lighting
function Scene() {
	const globalMouse = useGlobalMouse()
	const {data: blocks = [], isLoading} = useBlocks() // blocks[0] is newest
	// const {data: blocks = []} = useBlocks()
	// const isLoading = false

	return (
		<>
			<ambientLight intensity={0.8} />
			<directionalLight position={[5, 8, 3]} intensity={1.5} />
			{(isLoading ? Array.from({length: MAX_NUM_CUBES}) : blocks).map((_, slot) => {
				const baseX = (slot - 2) * (CUBE_SIZE + GAP_BETWEEN_CUBES)

				return (
					<Cube
						key={slot} // slot index key is fine
						index={slot}
						baseX={baseX}
						globalMouse={globalMouse}
						loading={isLoading} // keep wave on placeholders
						block={blocks[slot] || undefined}
					/>
				)
			})}
		</>
	)
}

// Main Component
export default function Blocks() {
	return (
		<div className='w-[768px] h-[180px] overflow-hidden'>
			<Canvas orthographic camera={{position: [0, 0, 8], zoom: 50}}>
				<Scene />
			</Canvas>
		</div>
	)
}
