// TODO: Add lightning to the globe
// TODO: check what comets look like when peers are close to user

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
const COMET_TAIL_COLOR = 'hsl(29,100%,70%)'
const COMET_HEAD_COLOR = 'hsl(29,100%,80%)'
const COMET_SPEED = 2000 // head travel time (ms)
const COMET_FADE_TIME = 300 // fade out tail+head (ms) - reduced from 500
const TAIL_SEGMENTS = 64 // resolution of the tail line

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
	const comets = useRef<
		{
			group: THREE.Group
			start: number
			startVec: THREE.Vector3
			endVec: THREE.Vector3
			pathPoints: THREE.Vector3[] // Store the path points
			trailPositions: THREE.Vector3[] // Store recent positions for trail
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
	// `txCount` is the total of all counts we’ve received while the ws is open.
	// We derive `needed = txCount - lastTxCount` and spawn that many comets
	// in one render pass, so every transaction is visualised once while message
	// traffic stays capped at ≤30 frames / sec.
	useEffect(() => {
		const needed = txCount - lastTxCount.current // how many comets this slice
		if (needed <= 0) return
		lastTxCount.current = txCount

		if (!globe.current || !dots.length || !scene.current) return

		const user = dots.find((d) => (d as any).isUser) || dots[0]
		const peerDots = dots.filter((d) => !(d as any).isUser)
		if (!peerDots.length) return

		for (let k = 0; k < needed; k++) {
			const randomPeer = peerDots[(Math.random() * peerDots.length) | 0]

			// --- build vectors ------------------------------------------------------
			const startVec = latLngToVec3(randomPeer.lat, randomPeer.lng, 0.01)
			const endVec = latLngToVec3(user.lat, user.lng, 0.01)

			// --- pre-compute path points (tail) -------------------------------------
			const tailPts: THREE.Vector3[] = []
			for (let i = 0; i <= TAIL_SEGMENTS; i++) {
				tailPts.push(slerpOnSphere(startVec, endVec, i / TAIL_SEGMENTS, 0.01))
			}

			// --- glowing particle tail ---------------------------------------------
			const particleCount = 30
			const particlePos = new Float32Array(particleCount * 3)
			const particleSizes = new Float32Array(particleCount)
			const particleOpac = new Float32Array(particleCount)

			for (let i = 0; i < particleCount; i++) {
				particlePos[i * 3] = startVec.x
				particlePos[i * 3 + 1] = startVec.y
				particlePos[i * 3 + 2] = startVec.z

				const t = i / particleCount
				particleSizes[i] = Math.pow(1 - t, 2.5) * 6 + 0.5
				particleOpac[i] = Math.pow(1 - t, 1.5)
			}

			const particleGeom = new THREE.BufferGeometry()
			particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePos, 3))
			particleGeom.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1))
			particleGeom.setAttribute('opacity', new THREE.BufferAttribute(particleOpac, 1))

			const particleMat = new THREE.ShaderMaterial({
				uniforms: {
					color: {value: new THREE.Color(COMET_TAIL_COLOR)},
					globalOpacity: {value: 1.0},
				},
				vertexShader: `
					attribute float size;
					attribute float opacity;
					varying float vOpacity;
					uniform float globalOpacity;
					void main() {
						vOpacity = opacity * globalOpacity;
						vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
						gl_PointSize = size * (500.0 / -mvPosition.z);
						gl_Position  = projectionMatrix * mvPosition;
					}
				`,
				fragmentShader: `
					uniform  vec3  color;
					varying  float vOpacity;
					void main() {
						vec2  c   = gl_PointCoord - 0.5;
						float d   = length(c);
						float a   = 1.0 - smoothstep(0.0, 0.5, d);
						a         = pow(a, 2.0);
						gl_FragColor = vec4(color, a * vOpacity);
					}
				`,
				transparent: true,
				depthWrite: false,
				blending: THREE.AdditiveBlending,
			})

			const tailParticles = new THREE.Points(particleGeom, particleMat)

			// --- head sphere --------------------------------------------------------
			const headGeo = new THREE.SphereGeometry(1.5, 16, 16)
			const headMat = new THREE.MeshBasicMaterial({
				color: COMET_HEAD_COLOR,
				transparent: true,
				opacity: 1,
			})
			const head = new THREE.Mesh(headGeo, headMat)
			head.position.copy(startVec)

			// --- group & add to globe ----------------------------------------------
			const group = new THREE.Group()
			group.add(tailParticles)
			group.add(head)
			globe.current.add(group)

			comets.current.push({
				group,
				start: performance.now(),
				startVec,
				endVec,
				pathPoints: tailPts,
				trailPositions: [],
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

		function updateComets(now: number) {
			for (let i = comets.current.length - 1; i >= 0; i--) {
				const c = comets.current[i]
				const elapsed = now - c.start
				if (elapsed <= COMET_SPEED) {
					const t = elapsed / COMET_SPEED
					// Interpolate along the stored path points
					const pathIndex = t * (c.pathPoints.length - 1)
					const index = Math.floor(pathIndex)
					const fraction = pathIndex - index

					let pos: THREE.Vector3
					if (index >= c.pathPoints.length - 1) {
						pos = c.pathPoints[c.pathPoints.length - 1].clone()
					} else {
						// Linear interpolation between two adjacent path points
						pos = c.pathPoints[index].clone()
						pos.lerp(c.pathPoints[index + 1], fraction)
					}

					// Update head position
					c.group.children[1].position.copy(pos) // head is 2nd child

					// Update trail positions
					c.trailPositions.unshift(pos.clone())
					if (c.trailPositions.length > 30) {
						// Match particle count
						c.trailPositions.pop()
					}

					// Update the particle tail geometry
					const tailParticles = c.group.children[0] as THREE.Points
					const positions = tailParticles.geometry.attributes['position'] as THREE.BufferAttribute

					// Update particle positions to create a trail effect
					for (let j = 0; j < 30; j++) {
						// 30 particles
						if (j < c.trailPositions.length) {
							const trailPos = c.trailPositions[j]
							positions.setXYZ(j, trailPos.x, trailPos.y, trailPos.z)
						} else {
							// Keep remaining particles at the last known position
							const lastPos = c.trailPositions[c.trailPositions.length - 1] || pos
							positions.setXYZ(j, lastPos.x, lastPos.y, lastPos.z)
						}
					}
					positions.needsUpdate = true
				} else if (elapsed <= COMET_SPEED + COMET_FADE_TIME) {
					const fade = 1 - (elapsed - COMET_SPEED) / COMET_FADE_TIME

					// Simple fade without complex position updates
					const particleMat = (c.group.children[0] as any).material
					if (particleMat.uniforms && particleMat.uniforms.globalOpacity) {
						particleMat.uniforms.globalOpacity.value = fade
					}
					;(c.group.children[1] as any).material.opacity = fade
				} else {
					// dispose & remove
					c.group.traverse((obj) => {
						if ('geometry' in obj && obj.geometry) obj.geometry.dispose()
						if ('material' in obj && (obj.material as any)) {
							const m = obj.material as any
							if (Array.isArray(m)) m.forEach((mm) => mm.dispose())
							else m.dispose()
						}
					})
					globe.current.remove(c.group)
					comets.current.splice(i, 1)
				}
			}
		}

		;(function loop() {
			globe.current.rotation.y += AUTOROTATE_SPEED
			ctl.update()
			updateComets(performance.now())
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

		// DEBUG: Show static arc lines between peers and user (comment out to disable)
		const SHOW_DEBUG_ARCS = false
		if (SHOW_DEBUG_ARCS && dots.length > 0) {
			// Clear existing debug lines
			const existingDebugLines = globe.current.children.filter((child: any) => child.userData?.isDebugArc)
			existingDebugLines.forEach((line: any) => globe.current.remove(line))

			const user = dots.find((d) => (d as any).isUser) || dots[0]
			const peerDots = dots.filter((d) => !(d as any).isUser)

			peerDots.forEach((peer: any) => {
				const startVec = latLngToVec3(peer.lat, peer.lng, 0.01)
				const endVec = latLngToVec3(user.lat, user.lng, 0.01)

				// Create arc points using same calculation as comets
				const arcPoints: THREE.Vector3[] = []
				for (let i = 0; i <= TAIL_SEGMENTS; i++) {
					arcPoints.push(slerpOnSphere(startVec, endVec, i / TAIL_SEGMENTS, 0.01))
				}

				// Create line geometry
				const lineGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints)
				const lineMaterial = new THREE.LineBasicMaterial({
					color: 0xff0000, // Red color for visibility
					transparent: true,
					opacity: 0.5,
				})
				const line = new THREE.Line(lineGeometry, lineMaterial)
				line.userData = {isDebugArc: true} // Mark for cleanup

				globe.current.add(line)
			})
		}
	}, [dots])

	return <div ref={mount} style={{width: SIZE, height: SIZE, margin: '0 auto'}} />
}
