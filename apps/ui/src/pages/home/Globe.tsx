import {useState, useEffect, useMemo, useRef, useCallback} from 'react'
import Globe from 'react-globe.gl'
import * as THREE from 'three'
import {latLngToCell, cellToLatLng} from 'h3-js'
import {ErrorBoundary} from 'react-error-boundary'

import {usePeerLocations} from '@/hooks/usePeers'
import {useTransactionSocket} from '@/hooks/useTransactionSocket'

import GlobeImage from '@/assets/globe-full.webp'

// ===== VISUAL CONSTANTS =====

// Globe appearance and atmosphere
const ATMOSPHERE_COLOR = 'white'
const ATMOSPHERE_ALTITUDE = 0.12
const AUTO_ROTATE_SPEED = 0.5

// Hex polygon landmass display
const HEX_POLYGON_COLOR = 'rgba(51, 51, 51, 0.8)'
const HEX_POLYGON_RESOLUTION = 3
const HEX_POLYGON_MARGIN = 0.4 // Higher = smaller hex dots, Lower = larger hex dots
const HEX_POLYGON_ALTITUDE = 0.001
const HEX_MAP_RESOLUTION = 3

// User and peer location markers
const USER_DOT_COLOR = '#FFF'
const USER_DOT_RADIUS = 0.8
const PEER_DOT_COLOR = 'hsl(29,100%,60%)'
const PEER_DOT_RADIUS = 0.4
const POINT_ALTITUDE = 0.01

// Arc lines connecting peers to user
const ARC_COLOR = 'hsl(29,100%,60%)'
const ARC_OPACITY = 0.35
const ARC_CURVE_RESOLUTION = 64 // Number of segments in arc curve (higher = smoother)
const ARC_IDENTIFIER = 'isCustomArc' // UserData identifier for custom arc lines
const ARC_BASE_ALTITUDE = 0.01 // Base altitude above globe surface
const ARC_HEIGHT_MULTIPLIER = 0.05 // Controls how high arcs curve (higher = more curved)

// Transaction sphere animation
const TX_SPHERE_RADIUS = 0.6
const TX_SPHERE_COLOR = 'hsl(29,90%,70%)'
const TX_SPEED = 125 // units per second
const MAX_SPHERES_PER_UPDATE = 20 // Max spheres to spawn per transaction count update
const MAX_CONCURRENT_SPHERES = 75 // Max total spheres animating simultaneously

// If WebGL is not supported, show a static image of the globe
// This will happen on Tor Browser and some older browsers
function ImageFallback({width = 650, height = 650}: {width?: number; height?: number}) {
	return (
		<div style={{width: width, height: height, scale: 0.8}}>
			<img src={GlobeImage} />
		</div>
	)
}

export default function LiveGlobe({width = 650, height = 650}: {width?: number; height?: number}) {
	return (
		<ErrorBoundary fallbackRender={() => <ImageFallback width={width} height={height} />}>
			<LiveGlobeWebGL width={width} height={height} />
		</ErrorBoundary>
	)
}

function LiveGlobeWebGL({width = 650, height = 650}: {width?: number; height?: number}) {
	const [countries, setCountries] = useState({features: []})
	const [isReady, setIsReady] = useState(false)
	const globeRef = useRef<any>(null)
	const animatedSpheresRef = useRef<any[]>([])

	// Reusable geometries and materials for better performance
	const sphereGeometryRef = useRef<THREE.SphereGeometry>(new THREE.SphereGeometry(TX_SPHERE_RADIUS, 8, 6))
	const sphereMaterialRef = useRef<THREE.MeshBasicMaterial>(new THREE.MeshBasicMaterial({color: TX_SPHERE_COLOR}))

	const {data} = usePeerLocations()
	const txCount = useTransactionSocket()
	const lastTxCount = useRef(txCount)

	// Snap a peer location marker to the map grid
	const snapToMap = useCallback(
		([lat, lng]: [number, number]) => cellToLatLng(latLngToCell(lat, lng, HEX_MAP_RESOLUTION)) as [number, number],
		[],
	)

	// Create location markers for each peer and the user
	const markers = useMemo(() => {
		if (!data) return []

		// We track peer counts per hex cell to scale radius with peer count, but we deduplicate peers to not plot multiple on the same cell
		const hexPeerCounts = new Map<string, number>()
		const peers: any[] = []
		let userDot: any = null

		// Count all peers per hex cell first
		for (const p of data.peers) {
			const [lat, lng] = snapToMap(p.location)
			const key = `${lat},${lng}`
			hexPeerCounts.set(key, (hexPeerCounts.get(key) || 0) + 1)
		}

		// Plot user first so they never get hidden by other peers
		if (Array.isArray(data.userLocation)) {
			const [lat, lng] = snapToMap(data.userLocation)
			const key = `${lat},${lng}`
			// If user is in same hex as peers, add to the count
			if (hexPeerCounts.has(key)) {
				hexPeerCounts.set(key, hexPeerCounts.get(key)! + 1)
			}
			userDot = {lat, lng, isUser: true}
		}

		// Create unique peer markers with peer counts
		const processedHexes = new Set<string>()
		for (const p of data.peers) {
			const [lat, lng] = snapToMap(p.location)
			const key = `${lat},${lng}`

			// Skip if this hex already processed or occupied by user
			if (processedHexes.has(key)) continue
			if (userDot && `${userDot.lat},${userDot.lng}` === key) continue

			processedHexes.add(key)
			const peerCount = hexPeerCounts.get(key) || 1
			peers.push({lat, lng, peerCount})
		}

		return userDot ? [userDot, ...peers] : peers
	}, [data, snapToMap])

	// List of arc lines that connect each peer to the user.
	// Each arc line is displayed as a line that rises from the surface of the globe, connecting the start and end coordinates.
	const arcsData = useMemo(() => {
		if (!data?.userLocation || !markers.length) return []

		const userMarker = markers.find((marker) => marker.isUser)
		if (!userMarker) return []

		// Connect each peer (non-user marker) to the user
		return markers
			.filter((marker) => !marker.isUser)
			.map((peerMarker) => ({
				startLat: peerMarker.lat,
				startLng: peerMarker.lng,
				endLat: userMarker.lat,
				endLng: userMarker.lng,
			}))
	}, [markers, data])

	// Convert lat/lng to 3D coordinates
	const latLngToVector3 = useCallback((lat: number, lng: number, altitude: number = ARC_BASE_ALTITUDE) => {
		const GLOBE_RADIUS = 100 // react-globe.gl default radius
		const lambda = (lng * Math.PI) / 180
		const phi = (lat * Math.PI) / 180
		const cosPhi = Math.cos(phi)
		const r = GLOBE_RADIUS * (1 + altitude)

		return new THREE.Vector3(r * cosPhi * Math.sin(lambda), r * Math.sin(phi), r * cosPhi * Math.cos(lambda))
	}, [])

	// Spherical interpolation along arc path
	const slerpOnSphere = useCallback((start: THREE.Vector3, end: THREE.Vector3, t: number) => {
		const angle = start.angleTo(end)
		if (angle === 0) return start.clone()

		const sinAngle = Math.sin(angle)
		const ratioA = Math.sin((1 - t) * angle) / sinAngle
		const ratioB = Math.sin(t * angle) / sinAngle

		const result = new THREE.Vector3()
		result.addScaledVector(start, ratioA)
		result.addScaledVector(end, ratioB)

		const RADIUS = 100
		const altitude = ARC_BASE_ALTITUDE
		const r = RADIUS * (1 + altitude)
		result.normalize().multiplyScalar(r)

		const arcHeight = Math.sin(t * Math.PI) * angle * RADIUS * ARC_HEIGHT_MULTIPLIER
		result.normalize().multiplyScalar(r + arcHeight)

		return result
	}, [])

	const pointColor = useCallback((dot: any) => (dot.isUser ? USER_DOT_COLOR : PEER_DOT_COLOR), [])
	const pointRadius = useCallback((dot: any) => {
		if (dot.isUser) return USER_DOT_RADIUS

		// Scale radius based on peer count, capped at 10 peers for reasonable max size
		const peerCount = Math.min(dot.peerCount || 1, 10)
		const scaleFactor = 1 + (peerCount - 1) * 0.15 // Each additional peer adds 15% to radius
		return PEER_DOT_RADIUS * scaleFactor
	}, [])
	const hexPolygonColor = useCallback(() => HEX_POLYGON_COLOR, [])

	// USEEFFECTS TO LOAD DATA AND ANIMATE THE GLOBE

	// load the landmass map
	useEffect(() => {
		fetch('/datasets/ne_110m_admin_0_countries.geojson')
			.then((res) => res.json())
			.then(setCountries)
	}, [])

	// Enable auto-rotation and disable zooming
	useEffect(() => {
		if (globeRef.current) {
			const controls = globeRef.current.controls()
			controls.autoRotate = true
			controls.autoRotateSpeed = AUTO_ROTATE_SPEED
			controls.enableZoom = false
		}
	}, [])

	// Set initial camera position to tilt globe toward northern hemisphere and center near North America
	const handleGlobeReady = useCallback(() => {
		if (globeRef.current) {
			globeRef.current.pointOfView({lat: 30, lng: -80}, 0)
		}
	}, [])

	// Add custom arcs that match sphere paths
	useEffect(() => {
		if (!globeRef.current || !arcsData.length) return

		const scene = globeRef.current.scene()

		// Remove existing custom arcs
		const existingArcs = scene.children.filter((child: any) => child.userData?.[ARC_IDENTIFIER])
		existingArcs.forEach((arc: any) => {
			scene.remove(arc)
			arc.geometry.dispose()
			arc.material.dispose()
		})

		// Create arcs using same spherical interpolation as spheres
		arcsData.forEach((arc) => {
			const startVec = latLngToVector3(arc.startLat, arc.startLng)
			const endVec = latLngToVector3(arc.endLat, arc.endLng)

			// Create arc points using same slerpOnSphere function
			const arcPoints: THREE.Vector3[] = []
			for (let i = 0; i <= ARC_CURVE_RESOLUTION; i++) {
				arcPoints.push(slerpOnSphere(startVec, endVec, i / ARC_CURVE_RESOLUTION))
			}

			// Create line geometry
			const lineGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints)
			const lineMaterial = new THREE.LineBasicMaterial({
				color: ARC_COLOR,
				transparent: true,
				opacity: ARC_OPACITY,
			})
			const line = new THREE.Line(lineGeometry, lineMaterial)
			line.userData = {[ARC_IDENTIFIER]: true}

			scene.add(line)
		})
	}, [arcsData, latLngToVector3, slerpOnSphere])

	// Animate spheres along arc lines when transactions come in
	useEffect(() => {
		// The backend collapses every 33 ms slice of transactions into one websocket message that carries `count = #txs` .
		// `txCount` is the total of all counts we've received while the ws is open.
		// We derive `needed = txCount - lastTxCount` and spawn that many spheres in one render pass, so every transaction is visualised once while message traffic stays capped at ≤30 frames / sec.
		const needed = txCount - lastTxCount.current
		if (needed <= 0) return
		lastTxCount.current = txCount

		if (!globeRef.current || !arcsData.length) return

		// Performance protection: we limit sphere creation to 20 per update and 75 total on the sphere at once
		const currentActiveSpheres = animatedSpheresRef.current.length
		const availableSlots = MAX_CONCURRENT_SPHERES - currentActiveSpheres
		const spheresToCreate = Math.min(needed, MAX_SPHERES_PER_UPDATE, availableSlots)

		// return early if no slots available
		if (spheresToCreate <= 0) return

		const scene = globeRef.current.scene()

		for (let i = 0; i < spheresToCreate; i++) {
			const randomIndex = Math.floor(Math.random() * arcsData.length)
			const randomArc = arcsData[randomIndex]

			const sphere = new THREE.Mesh(sphereGeometryRef.current, sphereMaterialRef.current)

			const startVec = latLngToVector3(randomArc.startLat, randomArc.startLng)
			const endVec = latLngToVector3(randomArc.endLat, randomArc.endLng)

			// Calculate arc length for constant speed
			const angle = startVec.angleTo(endVec)
			const RADIUS = 100
			const altitude = ARC_BASE_ALTITUDE
			const r = RADIUS * (1 + altitude)
			const arcHeight = Math.sin(Math.PI * 0.5) * angle * RADIUS * ARC_HEIGHT_MULTIPLIER
			const approximateArcLength = angle * (r + arcHeight * 0.5)

			// ms to complete the arc
			const duration = (approximateArcLength / TX_SPEED) * 1000

			sphere.position.copy(startVec)
			scene.add(sphere)

			// Store animation data for each sphere
			animatedSpheresRef.current.push({
				sphere,
				startVec,
				endVec,
				startTime: Date.now(),
				duration: duration,
			})
		}
	}, [txCount, arcsData, latLngToVector3])

	// Animation loop
	useEffect(() => {
		if (!globeRef.current) return

		let animationId: number | null = null

		const animate = () => {
			// Check if component is still mounted and globe exists
			if (!globeRef.current) return

			const now = Date.now()
			const scene = globeRef.current.scene()

			// Update sphere positions
			animatedSpheresRef.current = animatedSpheresRef.current.filter(
				({sphere, startVec, endVec, startTime, duration}) => {
					const elapsed = now - startTime

					if (elapsed < duration) {
						const progress = elapsed / duration
						const position = slerpOnSphere(startVec, endVec, progress)
						sphere.position.copy(position)
						return true
					} else {
						// Remove completed sphere (don't dispose shared geometry/material)
						scene.remove(sphere)
						return false
					}
				},
			)

			if (animatedSpheresRef.current.length > 0 && globeRef.current) {
				animationId = requestAnimationFrame(animate)
			}
		}

		if (animatedSpheresRef.current.length > 0) {
			animate()
		}

		// Cleanup animation on unmount
		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId)
			}
		}
	}, [txCount, slerpOnSphere])

	// Fade in effect after initial render
	useEffect(() => {
		const timer = setTimeout(() => setIsReady(true), 1000)
		return () => clearTimeout(timer)
	}, [])

	return (
		<div className={`transition-opacity duration-500 ease-in-out ${isReady ? 'opacity-100' : 'opacity-0'}`}>
			<Globe
				ref={globeRef}
				width={width}
				height={height}
				// canvas background (transparent)
				backgroundColor='rgba(0,0,0,0)'
				// Performance optimizations
				enablePointerInteraction={false}
				waitForGlobeReady={true}
				// Configuration for ThreeJS WebGLRenderer: antialias=smooth edges, alpha=transparency support, powerPreference=use high-performance GPU
				rendererConfig={{antialias: true, alpha: true, powerPreference: 'high-performance'}}
				// atmosphere
				atmosphereColor={ATMOSPHERE_COLOR}
				atmosphereAltitude={ATMOSPHERE_ALTITUDE}
				// initial camera position
				onGlobeReady={handleGlobeReady}
				// landmass map
				hexPolygonsData={countries.features}
				hexPolygonResolution={HEX_POLYGON_RESOLUTION}
				hexPolygonMargin={HEX_POLYGON_MARGIN}
				hexPolygonUseDots={true}
				hexPolygonColor={hexPolygonColor}
				hexPolygonAltitude={HEX_POLYGON_ALTITUDE}
				// peer location markers
				pointsData={markers}
				pointColor={pointColor}
				pointAltitude={POINT_ALTITUDE}
				pointRadius={pointRadius}
				pointsMerge={true} // Performance optimization for points

				// Using custom Three.js arc lines instead of react-globe.gl Arcs Layer (e.g., arcsData) so we can align the sphere animations with the arc lines perfectly
			/>
		</div>
	)
}
