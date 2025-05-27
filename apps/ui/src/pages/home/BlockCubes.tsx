import {Canvas, useFrame} from '@react-three/fiber'
import {RoundedBox} from '@react-three/drei'
import {useRef, useState, useEffect} from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

import {useBlocks} from '@/hooks/useBlocks'
import type { BlockSummary } from '@umbrel-bitcoin/shared-types'

const NUM_CUBES = 5
const CUBE_SIZE = 2.8
const GAP = 0.15
const MAX_ROT = 0.15
const FOLLOW_SPEED = 0.05 // Controls how fast cubes follow mouse (0.05 = slower, 0.2 = faster)

/* ---------- 1. mock loading flag (hook this to real data later) ----------- */
// let loading = true        // ➡️ flip to false to see the “loaded” behaviour
// const [loading, setLoading] = useState(true)

/* ------------------------------------------------------------------ */
/*  Tune these four numbers to get the exact “feel” you want          */
/* ------------------------------------------------------------------ */
const AMPLITUDE = 0.2 // how high every cube hops (world units)
const CUBE_DELAY = 0.2 // secs between one cube and the next
const BOUNCE_DURATION = 0.4 // time a single cube spends doing its up-down
// const PAUSE_AFTER_WAVE= 1.00   // secs to sit still after the 5th cube lands
const PAUSE_AFTER_WAVE = 0.2 // secs to sit still after the 5th cube lands
/* full cycle length = propagation time + pause */
const CYCLE = (NUM_CUBES - 1) * CUBE_DELAY + BOUNCE_DURATION + PAUSE_AFTER_WAVE

/* ---------------- Global mouse tracking ---------------- */
function useGlobalMouse() {
	const [mouse, setMouse] = useState({x: 0, y: 0})

	useEffect(() => {
		const handleMouseMove = (event: MouseEvent) => {
			const x = (event.clientX / window.innerWidth) * 2 - 1
			const y = -(event.clientY / window.innerHeight) * 2 + 1
			setMouse({x, y})
		}

		window.addEventListener('mousemove', handleMouseMove)
		return () => window.removeEventListener('mousemove', handleMouseMove)
	}, [])

	return mouse
}

/* --- Single cube + black front-plane -------------------------------------- */
const BEVEL = 0.03 // same radius as RoundedBox
const FACE_GAP = 0 // 0.02 world-units so bevel edge is visible
const PLANE_Z = 1.5 / 2 + 0.001 // flush + 1 mm to avoid z-fight

function Cube({
	index,
	baseX,
	shiftRef,
	globalMouse,
	loading,
  block
}: {
	index: number
	baseX: number
	shiftRef: React.MutableRefObject<number>
	globalMouse: {x: number; y: number}
	loading: boolean
  block?: BlockSummary | undefined
}) {
	const group = useRef<THREE.Group>(null!)
	const facePlane = useRef<THREE.Mesh>(null!) // in case you need it later

	useFrame(({clock}) => {
		if (!group.current) return

		/* ▶ apply global slide offset */
		group.current.position.x = baseX + shiftRef.current

		const ry = globalMouse.x * MAX_ROT
		const rx = -globalMouse.y * MAX_ROT
		group.current.rotation.y += (ry - group.current.rotation.y) * FOLLOW_SPEED
		group.current.rotation.x += (rx - group.current.rotation.x) * FOLLOW_SPEED

		/* ---------- 2. propagating pulse while loading ----------- */
		if (loading) {
			const t = clock.elapsedTime

			/* where are we in the cycle? 0 … CYCLE seconds, then it wraps */
			const cycleT = t % CYCLE

			/* when *this* cube’s personal bounce starts */
			const startT = index * CUBE_DELAY
			const endT = startT + BOUNCE_DURATION

			if (cycleT >= startT && cycleT <= endT) {
				/* normalised 0 → π gives smooth up-and-down */
				const local = (cycleT - startT) / BOUNCE_DURATION
				group.current.position.y = AMPLITUDE * Math.sin(local * Math.PI)
			} else {
				group.current.position.y = 0
			}
		} else {
			group.current.position.y = 0
		}
	})

	/* plane = cube width minus two bevels & the gap */
	const faceSize = CUBE_SIZE - BEVEL * 2 - FACE_GAP * 2

	return (
		<group ref={group}>
			{/* rounded white cube */}
			<RoundedBox args={[CUBE_SIZE, CUBE_SIZE, 1.5]} radius={BEVEL} smoothness={4}>
				<meshStandardMaterial color='#ffffff' />
			</RoundedBox>

			{/* inset black front-face, ready for block data */}
			<mesh ref={facePlane} position={[0, 0, PLANE_Z]}>
				<planeGeometry args={[faceSize, faceSize]} />
				<meshStandardMaterial color='#000000' />
			</mesh>

      {/* --- temporary debug label --- */}
      {block && (
        <Text
          position={[0, 0, PLANE_Z + 0.02]}
          fontSize={0.5}
          color="#ff7e05"
          anchorX="center"
          anchorY="middle"
        >
          {block.height}
        </Text>
      )}
		</group>
	)
}

/* ---------------- Scene with proper camera and lighting ---------------- */
function Scene() {
	const globalMouse = useGlobalMouse()
	const { data: blocks = [], isLoading } = useBlocks()   // blocks[0] is newest

	/* ▶ 2. shiftOffset animates from 0 → slotWidth every 4 s */
	const slotWidth = CUBE_SIZE + GAP
	const shiftRef = useRef(0) // current offset
	const shifting = useRef(false) // are we mid-animation?

	useEffect(() => {
		if (!isLoading) shifting.current = true // slide once per new block list
	}, [blocks, isLoading])

	/* ▶ 3. advance the global shift in a frame loop */
	useFrame((_, delta) => {
		if (!shifting.current) return
		shiftRef.current += delta * slotWidth * 2 // speed: 2 units / s

		if (shiftRef.current >= slotWidth) {
			shiftRef.current = 0 // snap back
			shifting.current = false // wait for next timer tick
		}
	})

	return (
		<>
			<ambientLight intensity={0.5} />
			<directionalLight position={[5, 5, 5]} intensity={0.8} />
			{/* {Array.from({length: NUM_CUBES}, (_, i) => {
				const baseX = (i - (NUM_CUBES - 1) / 2) * (CUBE_SIZE + GAP)
				return <Cube key={i} index={i} baseX={baseX} shiftRef={shiftRef} globalMouse={globalMouse} />
			})} */}
{(isLoading ? Array.from({ length: NUM_CUBES }) : blocks).map((_, slot) => {
  const baseX = (slot - 2) * (CUBE_SIZE + GAP)

  return (
    <Cube
      key={slot}                 // slot index key is fine
      index={slot}
      baseX={baseX}
      shiftRef={shiftRef}
      globalMouse={globalMouse}
      loading={isLoading}          // keep wave on placeholders
      block={blocks[slot] || undefined}

    />
  )
})}
		</>
	)
}

/* ---------------- Main component ---------------- */
export default function BlockCubes() {
	return (
		<div className='w-[768px] h-[180px] overflow-hidden'>
			<Canvas orthographic camera={{position: [0, 0, 8], zoom: 50}}>
				<Scene />
			</Canvas>
		</div>
	)
}
