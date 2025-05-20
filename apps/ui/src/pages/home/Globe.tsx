// TODO: refactor to allow dragging the globe in any direction
import createGlobe from 'cobe'
import {useEffect, useRef} from 'react'
import {useSpring} from 'react-spring'

export default function Globe() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const pointerInteracting = useRef<number | null>(null)
	const pointerInteractionMovement = useRef(0)
	const [{r}, api] = useSpring(() => ({
		r: 0,
		config: {
			mass: 1,
			tension: 280,
			friction: 40,
			precision: 0.001,
		},
	}))
	useEffect(() => {
		let phi = 0
		let width = 0
		const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth)
		window.addEventListener('resize', onResize)
		onResize()
		if (!canvasRef.current) {
			return
		}
		const globe = createGlobe(canvasRef.current, {
			devicePixelRatio: 2,
			width: width * 2,
			height: width * 2,
			phi: 0,
			theta: 0.3, // some rotation axis
			dark: 1,
			diffuse: 3,
			mapSamples: 16000, // dots on the map
			mapBrightness: 5,
			baseColor: [0.15, 0.15, 0.15], // actual map color
			markerColor: [255 / 255, 126 / 255, 5 / 255],
			glowColor: [0.1, 0.1, 0.1], // halo
			// placeholder markers for now
			markers: [
				// NA
				{location: [37.7595, -122.4367], size: 0.02},
				{location: [40.7128, -74.006], size: 0.02},
				// italy
				{location: [41.9033, 12.4534], size: 0.02},
				// russia
				{location: [55.7558, 37.6173], size: 0.02},
				// china
				{location: [39.9087, 116.3975], size: 0.02},
				// india
				{location: [20.5937, 78.9629], size: 0.02},
				// brazil
				{location: [-14.235, -51.9253], size: 0.02},
			],
			scale: 1.1,
			onRender: (state) => {
				// This prevents rotation while dragging
				if (!pointerInteracting.current) {
					// Called on every animation frame.
					// `state` will be an empty object, return updated params.
					phi += 0.0005
				}
				state['phi'] = phi + r.get()
				state['width'] = width * 2
				state['height'] = width * 2
				state['scale'] = 1.1
			},
		})
		setTimeout(() => {
			if (canvasRef.current) {
				canvasRef.current.style.opacity = '1'
			}
		})
		return () => {
			globe.destroy()
			window.removeEventListener('resize', onResize)
		}
	}, [])
	return (
		// TODO: make this nicely responsive between desktop and mobile
		<div className='absolute top-0 left-[50px] md:left-[120px] w-[120%] md:w-full aspect-square m-auto'>
			<canvas
				style={{
					width: '100%',
					height: '100%',
					cursor: 'grab',
					contain: 'layout paint size',
					opacity: 0,
					transition: 'opacity 1s ease',
				}}
				ref={canvasRef}
				onPointerDown={(e) => {
					pointerInteracting.current = e.clientX - pointerInteractionMovement.current
					if (canvasRef.current) {
						canvasRef.current.style.cursor = 'grabbing'
					}
				}}
				onPointerUp={() => {
					pointerInteracting.current = null
					if (canvasRef.current) {
						canvasRef.current.style.cursor = 'grab'
					}
				}}
				onPointerOut={() => {
					pointerInteracting.current = null
					if (canvasRef.current) {
						canvasRef.current.style.cursor = 'grab'
					}
				}}
				onMouseMove={(e) => {
					if (pointerInteracting.current !== null) {
						const delta = e.clientX - pointerInteracting.current
						pointerInteractionMovement.current = delta
						api.start({
							r: delta / 200,
						})
					}
				}}
				onTouchMove={(e) => {
					if (pointerInteracting.current !== null && e.touches[0]) {
						const delta = e.touches[0].clientX - pointerInteracting.current
						pointerInteractionMovement.current = delta
						api.start({
							r: delta / 100,
						})
					}
				}}
			/>
		</div>
	)
}
