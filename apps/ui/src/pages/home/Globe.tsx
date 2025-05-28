import {useEffect, useMemo, useRef} from 'react'
import createGlobe from 'cobe'

import {usePeerLocations} from '@/hooks/usePeers'

type Marker = {location: [number, number]; size: number}

export default function Globe() {
	const {data: peers = []} = usePeerLocations()

	// Create location markers for each peer
	const peerMarkers = useMemo<Marker[]>(() => peers.map((p) => ({location: p.location, size: 0.02})), [peers])

	// Cobe’s renderer keeps an internal pointer to the same array object for the lifetime of the globe.
	// We store that array in a ref so its identity never changes.
	// Whenever the peer list refreshes we mutate the array in-place (splice / push) instead of replacing it.
	// This lets dots appear/disappear without destroying or re-creating the WebGL context, so the user’s rotation stays intact and there’s no visual snap back to initial position.
	const markersRef = useRef<Marker[]>([])
	useEffect(() => {
		markersRef.current.splice(0, markersRef.current.length, ...peerMarkers)
	}, [peerMarkers])

	// Ref for canvas context
	const canvasRef = useRef<HTMLCanvasElement>(null)

	// Refs for user interaction
	// Pointer-down position; becomes null on release/leave.
	const dragStart = useRef<{x: number; y: number} | null>(null)
	// Yaw (left/right) offset set by user
	const userPhi = useRef(0)
	// Pitch (up/down) offset set by user
	const userTheta = useRef(0)

	// How many screen-pixels correspond to one radian of globe rotation.
	// Bigger  = slower drag; smaller = faster.
	const DRAG_SENSITIVITY = 200

	// We create globe exactly once (never re-runs)
	useEffect(() => {
		if (!canvasRef.current) return

		let autoPhi = 0
		let width = canvasRef.current.offsetWidth
		const onResize = () => (width = canvasRef.current!.offsetWidth)
		window.addEventListener('resize', onResize)

		const globe = createGlobe(canvasRef.current, {
			devicePixelRatio: 2,
			width: width * 2,
			height: width * 2,

			// Initial orientation; user offsets are added each frame below
			phi: 0,
			theta: 0.3,

			dark: 1,
			diffuse: 3,
			mapSamples: 16000,
			mapBrightness: 5,
			baseColor: [0.15, 0.15, 0.15],
			markerColor: [255 / 255, 126 / 255, 5 / 255],
			glowColor: [0.1, 0.1, 0.1],

			// peer location markers (stable array ref)
			markers: markersRef.current,
			scale: 1.1,

			// onRender is called every animation frame
			onRender(state) {
				// live peer locations
				state['markers'] = markersRef.current

				// idle spin only when not dragging
				if (!dragStart.current) autoPhi += 0.0005

				// yaw - combined auto + user drag
				state['phi'] = autoPhi + userPhi.current

				// pitch - combined base + user drag
				state['theta'] = 0.3 + userTheta.current

				// resize canvas to maintain aspect ratio
				state['width'] = width * 2
				state['height'] = width * 2
			},
		})

		// fade-in after first frame so we avoid a flash of un-styled content
		setTimeout(() => {
			if (canvasRef.current) canvasRef.current.style.opacity = '1'
		}, 0)

		let destroyed = false
		const safeDestroy = () => {
			if (!destroyed) {
				destroyed = true
				globe.destroy()
			}
		}

		// keep WebGL alive until the tab actually unloads → no white flash
		window.addEventListener('beforeunload', safeDestroy, {once: true})

		// component-level clean-up for client-side route changes
		return () => {
			safeDestroy()
			window.removeEventListener('beforeunload', safeDestroy)
		}
	}, [])

	return (
		<div className='absolute top-0 left-[50px] md:left-[120px] w-[120%] md:w-full aspect-square m-auto'>
			<canvas
				ref={canvasRef}
				style={{
					width: '100%',
					height: '100%',
					cursor: 'grab',
					contain: 'layout paint size',
					opacity: 0,
					transition: 'opacity 1s ease',
				}}
				// User pointer interaction for the globe
				onPointerDown={(e) => {
					dragStart.current = {
						x: e.clientX - userPhi.current * DRAG_SENSITIVITY,
						y: e.clientY - userTheta.current * DRAG_SENSITIVITY,
					}
					canvasRef.current!.style.cursor = 'grabbing'
				}}
				onPointerUp={() => {
					dragStart.current = null
					canvasRef.current!.style.cursor = 'grab'
				}}
				onPointerOut={() => {
					dragStart.current = null
					canvasRef.current!.style.cursor = 'grab'
				}}
				onMouseMove={(e) => {
					if (dragStart.current) {
						userPhi.current = (e.clientX - dragStart.current.x) / DRAG_SENSITIVITY
						userTheta.current = (e.clientY - dragStart.current.y) / DRAG_SENSITIVITY

						// We clamp pitch so the globe can only flip 180 degrees vertically
						userTheta.current = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, userTheta.current))
					}
				}}
				onTouchMove={(e) => {
					if (dragStart.current && e.touches[0]) {
						const t = e.touches[0]
						userPhi.current = (t.clientX - dragStart.current.x) / DRAG_SENSITIVITY
						userTheta.current = (t.clientY - dragStart.current.y) / DRAG_SENSITIVITY
						userTheta.current = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, userTheta.current))
					}
				}}
			/>
		</div>
	)
}
