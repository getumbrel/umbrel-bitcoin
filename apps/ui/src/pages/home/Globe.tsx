// TODO: Add lightning to the globe

// TODO: update this comment with actual implementation details once they are settled.
// This globe plots the postions of peers and the user
// It also animates transactions being heard:
// - One 'comet' per transaction, plays once, then fades and is disposed.
// - Never rebuilds three‑globe arc layer (we DON'T use `arcsData` at all which can't be used well for this).
// - Uses a static `THREE.Line` for the tail and a small sphere mesh for the head.
// - Only the head position & material opacity change per frame.

import {useEffect, useMemo, useRef} from 'react'
import * as THREE from 'three'
import Globe from 'three-globe'
import {TrackballControls} from 'three/examples/jsm/controls/TrackballControls.js'
import {latLngToCell, cellToLatLng} from 'h3-js'

import {usePeerLocations} from '@/hooks/usePeers'
import {useTransactionSocket} from '@/hooks/useTransactionSocket'

/* ─ visuals ─ */
const SIZE = 1050
const AUTOROTATE_SPEED = 0.0005
const HEX_MAP_RESOLUTION = 3 // higher means more hex dots
const HEX_MAP_COLOR = '#444'
const GLOBE_COLOR = '#0d0d0d'
const PEER_COLOR = 'hsl(29,100%,60%)'
const USER_COLOR = '#FFF'
const TX_SPHERE_COLOR = 'hsl(29,90%,70%)'
const TX_SPEED = 0.1 // speed in globe radius units per ms (distance/time)
const MAX_RENDERED_TX_AT_A_TIME = 100 // maximum number of active comets as a guardrail

// snap a location marker to the map grid
const snapToMap = ([lat, lng]: [number, number]) =>
	cellToLatLng(latLngToCell(lat, lng, HEX_MAP_RESOLUTION)) as [number, number]

const RADIUS = 100 // globe radius inside three‑globe

// convert a lat/lng to a 3D vector
function latLngToVec3(lat: number, lng: number, altitude: number = 0): THREE.Vector3 {
	// Three-globe uses this exact formula internally (from their polar2Cartesian function)
	const lambda = (lng * Math.PI) / 180
	const phi = (lat * Math.PI) / 180
	const cosPhi = Math.cos(phi)
	const r = RADIUS * (1 + altitude) // altitude is in globe radius units

	// Three-globe swaps X and Z compared to standard spherical coordinates
	return new THREE.Vector3(r * cosPhi * Math.sin(lambda), r * Math.sin(phi), r * cosPhi * Math.cos(lambda))
}

// spherical interpolation between two points on the sphere
function slerpOnSphere(a: THREE.Vector3, b: THREE.Vector3, t: number, altitude: number = 0) {
	// Spherical interpolation with altitude
	const angle = a.angleTo(b)
	if (angle === 0) return a.clone()

	const sinAngle = Math.sin(angle)
	const ratioA = Math.sin((1 - t) * angle) / sinAngle
	const ratioB = Math.sin(t * angle) / sinAngle

	const result = new THREE.Vector3()
	result.addScaledVector(a, ratioA)
	result.addScaledVector(b, ratioB)

	// Normalize and apply radius with altitude
	const r = RADIUS * (1 + altitude)
	result.normalize().multiplyScalar(r)

	// Add arc height - reduced to 0.05 for very subtle arcs
	const arcHeight = Math.sin(t * Math.PI) * angle * RADIUS * 0.05
	result.normalize().multiplyScalar(r + arcHeight)

	return result
}

// MAIN COMPONENT
export default function PeersGlobe() {
	const mount = useRef<HTMLDivElement>(null)
	const globe = useRef<any>(null)
	const scene = useRef<THREE.Scene>(new THREE.Scene())
	const orbs = useRef<
		{
			orb: THREE.Mesh
			start: number
			pathPoints: THREE.Vector3[] // Store the path points
			duration: number // Travel time in ms based on arc length and speed
		}[]
	>([])
	const booted = useRef(false)

	/* ─ dots from peer hook ─ */
	const {data} = usePeerLocations()
	const dots = useMemo(() => {
		if (!data) return []

		// We track the occupied map cells and deduplicate peers to not plot multiple on the same cell
		const occupied = new Set<string>()
		const peers: any[] = []
		let userDot: any = null

		// We plot the user first so they never get deduplicated
		if (Array.isArray(data.userLocation)) {
			const [lat, lng] = snapToMap(data.userLocation)
			occupied.add(`${lat},${lng}`)
			userDot = {lat, lng, r: 0.6, col: USER_COLOR, isUser: 1}
		}

		for (const p of data.peers) {
			const [lat, lng] = snapToMap(p.location)
			const key = `${lat},${lng}`
			if (occupied.has(key)) continue
			occupied.add(key)
			peers.push({lat, lng, r: 0.4, col: PEER_COLOR})
		}
		return userDot ? [userDot, ...peers] : peers
	}, [data])

	/* ─ transaction socket triggers comet ─ */
	const txCount = useTransactionSocket()
	const lastTxCount = useRef(txCount)

	// NOTE - Burst handling for tx animation:
	// The backend collapses every 33 ms slice of transactions into one websocket
	// message that carries  `count = #txs` .
	// `txCount` is the total of all counts we've received while the ws is open.
	// We derive `needed = txCount - lastTxCount` and spawn that many comets
	// in one render pass, so every transaction is visualised once while message
	// traffic stays capped at ≤30 frames / sec.
	useEffect(() => {
		const needed = txCount - lastTxCount.current // how many comets this slice
		if (needed <= 0) return
		lastTxCount.current = txCount

		if (!globe.current || !dots.length || !scene.current) return
		if (orbs.current.length >= MAX_RENDERED_TX_AT_A_TIME) return // don't create more if at max

		const user = dots.find((d) => (d as any).isUser) || dots[0]
		const peerDots = dots.filter((d) => !(d as any).isUser)
		if (!peerDots.length) return

		for (let k = 0; k < needed; k++) {
			if (orbs.current.length >= MAX_RENDERED_TX_AT_A_TIME) break // stop if we hit the max
			const randomPeer = peerDots[(Math.random() * peerDots.length) | 0]

			// --- build vectors ------------------------------------------------------
			const startVec = latLngToVec3(randomPeer.lat, randomPeer.lng, 0.01)
			const endVec = latLngToVec3(user.lat, user.lng, 0.01)

			// --- pre-compute path points --------------------------------------------
			const PATH_SEGMENTS = 64 // for the path calculation
			const pathPts: THREE.Vector3[] = []
			for (let i = 0; i <= PATH_SEGMENTS; i++) {
				pathPts.push(slerpOnSphere(startVec, endVec, i / PATH_SEGMENTS, 0.01))
			}

			// --- calculate arc length and travel duration ---------------------------
			let arcLength = 0
			for (let i = 1; i < pathPts.length; i++) {
				arcLength += pathPts[i].distanceTo(pathPts[i - 1])
			}
			const duration = arcLength / (TX_SPEED * 1) // travel time based on distance - faster speed

			// --- traveling sphere (ultra simple) -----------------------------------
			const orbGeo = new THREE.SphereGeometry(0.6, 6, 4) // very low-poly: 6 segments, 4 rings
			const orbMat = new THREE.MeshBasicMaterial({
				color: TX_SPHERE_COLOR,
				transparent: false,
			})
			const orb = new THREE.Mesh(orbGeo, orbMat)
			orb.position.copy(startVec)

			// --- add to globe -------------------------------------------------------
			globe.current.add(orb)

			orbs.current.push({
				orb,
				start: performance.now(),
				pathPoints: pathPts,
				duration,
			})
		}
	}, [txCount, dots])

	// Create globe & renderer once
	useEffect(() => {
		if (booted.current || !mount.current) return
		booted.current = true

		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true, // Enable transparency
		})
		renderer.setSize(SIZE, SIZE)
		renderer.setClearColor(0x000000, 0) // Transparent background
		renderer.domElement.style.pointerEvents = 'auto' // Allow interactions
		renderer.domElement.style.background = 'transparent' // Ensure transparency
		mount.current.appendChild(renderer.domElement)

		const sc = new THREE.Scene()
		scene.current = sc

		const cam = new THREE.PerspectiveCamera(undefined, 1, 0.1, 1000)
		cam.position.set(0, 300, 400)
		sc.add(cam)

		sc.add(new THREE.AmbientLight(0xcccccc, Math.PI))

		globe.current = new (Globe as any)()
		globe.current.globeMaterial().color.set(GLOBE_COLOR)
		globe.current.atmosphereColor('white').atmosphereAltitude(0.15).showAtmosphere(true)

		sc.add(globe.current)

		fetch('/datasets/ne_110m_admin_0_countries.geojson')
			.then((r) => r.json())
			.then((g) =>
				globe.current
					.hexPolygonsData(g.features)
					.hexPolygonResolution(HEX_MAP_RESOLUTION)
					.hexPolygonMargin(0.35)
					.hexPolygonUseDots(true)
					.hexPolygonDotResolution(10)
					.hexPolygonColor(() => HEX_MAP_COLOR)
					.hexPolygonAltitude(0.005),
			)

		const ctl = new TrackballControls(cam, renderer.domElement)
		ctl.noZoom = true
		ctl.noPan = true
		ctl.rotateSpeed = 5

		function updateOrbs(now: number) {
			for (let i = orbs.current.length - 1; i >= 0; i--) {
				const c = orbs.current[i]
				const elapsed = now - c.start
				if (elapsed <= c.duration) {
					// Smoothly move sphere along the path
					const t = elapsed / c.duration
					const pathIndex = t * (c.pathPoints.length - 1)
					const lowerIndex = Math.floor(pathIndex)
					const upperIndex = Math.min(lowerIndex + 1, c.pathPoints.length - 1)

					if (lowerIndex < c.pathPoints.length && upperIndex < c.pathPoints.length) {
						const localT = pathIndex - lowerIndex
						const position = new THREE.Vector3()
						position.lerpVectors(c.pathPoints[lowerIndex], c.pathPoints[upperIndex], localT)
						c.orb.position.copy(position)
					}
				} else {
					// dispose & remove when done
					c.orb.geometry.dispose()
					;(c.orb.material as any).dispose()
					globe.current.remove(c.orb)
					orbs.current.splice(i, 1)
				}
			}
		}

		;(function loop() {
			globe.current.rotation.y += AUTOROTATE_SPEED
			ctl.update()
			updateOrbs(performance.now())
			renderer.render(sc, cam) // Direct rendering instead of composer
			requestAnimationFrame(loop)
		})()
	}, [])

	// Update locations
	useEffect(() => {
		if (!globe.current) return
		globe.current
			.pointsData(dots)
			.pointLat('lat')
			.pointLng('lng')
			.pointAltitude(0.01)
			.pointRadius((d: any) => d.r * 1.5)
			.pointColor((d: any) => d.col)
			.pointsMerge(true)

		// Always show subtle connection arcs between peers and user
		if (dots.length > 0) {
			// Clear existing connection lines
			const existingConnections = globe.current.children.filter((child: any) => child.userData?.isConnectionArc)
			existingConnections.forEach((line: any) => globe.current.remove(line))

			const user = dots.find((d) => (d as any).isUser) || dots[0]
			const peerDots = dots.filter((d) => !(d as any).isUser)

			peerDots.forEach((peer: any) => {
				const startVec = latLngToVec3(peer.lat, peer.lng, 0.01)
				const endVec = latLngToVec3(user.lat, user.lng, 0.01)

				// Create arc points
				const arcPoints: THREE.Vector3[] = []
				for (let i = 0; i <= 64; i++) {
					arcPoints.push(slerpOnSphere(startVec, endVec, i / 64, 0.01))
				}

				// Create very subtle connection line
				const lineGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints)
				const lineMaterial = new THREE.LineBasicMaterial({
					color: PEER_COLOR, // Same as peer color but very faded
					transparent: true,
					opacity: 0.2, // Very subtle
					linewidth: 1,
				})
				const line = new THREE.Line(lineGeometry, lineMaterial)
				line.userData = {isConnectionArc: true} // Mark for cleanup

				globe.current.add(line)
			})
		}
	}, [dots])

	return <div ref={mount} style={{width: SIZE, height: SIZE, margin: '0 auto'}} />
}
