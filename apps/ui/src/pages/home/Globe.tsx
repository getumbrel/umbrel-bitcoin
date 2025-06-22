import {useEffect, useMemo, useRef} from 'react'
import * as THREE from 'three'
import Globe from 'three-globe'
import {TrackballControls} from 'three/examples/jsm/controls/TrackballControls.js'
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js'
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import {latLngToCell, cellToLatLng} from 'h3-js'

import {usePeerLocations} from '@/hooks/usePeers'
import {useTransactionSocket} from '@/hooks/useTransactionSocket'

import type {PeerLocation} from '#types'

/* ─ visuals ─ */
const SIZE = 1000
const ROT = 0.0005
const HEX = 3
const LAND = '#444'
const GCLR = '#0d0d0d'
const PEER = 'hsl(29,100%,60%)'
const TOR = 'hsl(29,100%,50%)'
const I2P = 'hsl(29,100%,30%)'
const USER = '#FFF'
const COMET = 'hsl(29,100%,50%)'
const COMET_SPEED = 2000 // duration in ms for comet to travel
const COMET_LENGTH = 0.05 // length of the comet (0-1)
const COMET_FADE_TIME = 500 // additional time for fade out
const COMET_COMPLETE_TIME = COMET_SPEED / (1 - COMET_LENGTH) // time for comet to fully exit
const COMET_STROKE = 1 // thickness of the comet tube (try values like 0.5, 1, 2, 3)
const COMET_ARC_HEIGHT = 0.5 // arc height multiplier (0.1 = low, 0.5 = medium, 1 = high)

/* helper */
const snap = ([lat, lng]: [number, number]) => cellToLatLng(latLngToCell(lat, lng, HEX)) as [number, number]

/* ─ component ─ */
export default function PeersGlobe() {
	const mount = useRef<HTMLDivElement>(null)
	const globe = useRef<any>(null)
	const booted = useRef(false)

	/* ─ dots ─ */
	const {data} = usePeerLocations()
	const dots = useMemo(() => {
		if (!data) return []
		const peers = data.peers.map((p: PeerLocation) => {
			const [lat, lng] = snap(p.location)
			const col = p.network === 'onion' ? TOR : p.network === 'i2p' ? I2P : PEER
			return {lat, lng, r: 0.4, col}
		})
		const user = Array.isArray(data.userLocation)
			? (() => {
					const [lat, lng] = snap(data.userLocation)
					return {lat, lng, r: 0.6, col: USER, isUser: 1}
				})()
			: null
		return user ? [user, ...peers] : peers
	}, [data])

	/* ─ store comets in a ref (mutable) ─ */
	const comets = useRef<any[]>([])
	const refreshArcs = () => globe.current?.arcsData(comets.current)

	/* ─ tx → push comet ─ */
	const ping = useTransactionSocket()
	const last = useRef(ping)
	useEffect(() => {
		if (ping === last.current) return
		last.current = ping
		if (!globe.current || !dots.length) return

		const src = dots.find((d) => (d as any).isUser) || dots[0]
		const tgt = dots.filter((d) => !(d as any).isUser)[(Math.random() * (dots.length - 1)) | 0]
		if (!tgt) return

		console.log('Creating comet from', src, 'to', tgt) // Debug log

		const comet = {
			startLat: src.lat,
			startLng: src.lng,
			endLat: tgt.lat,
			endLng: tgt.lng,
			color: COMET,
			stroke: COMET_STROKE,
			dashLength: COMET_LENGTH,
			dashGap: 1 - COMET_LENGTH,
			dashAnimateTime: COMET_SPEED,
		}
		comets.current.push(comet)
		refreshArcs()

		// Remove comet after animation completes plus fade time
		setTimeout(() => {
			const idx = comets.current.indexOf(comet)
			if (idx > -1) {
				comets.current.splice(idx, 1)
				refreshArcs()
			}
		}, COMET_COMPLETE_TIME + COMET_FADE_TIME)
	}, [ping, dots])

	/* ─ once: create globe ─ */
	useEffect(() => {
		if (booted.current || !mount.current) return
		booted.current = true

		const r = new THREE.WebGLRenderer({antialias: true})
		r.setSize(SIZE, SIZE)
		mount.current.appendChild(r.domElement)

		const scene = new THREE.Scene()
		const cam = new THREE.PerspectiveCamera(undefined, 1, 0.1, 1000)
		cam.position.set(0, 300, 400)

		const comp = new EffectComposer(r)
		comp.addPass(new RenderPass(scene, cam))
		comp.addPass(new UnrealBloomPass(new THREE.Vector2(SIZE, SIZE), 1.5, 0.4, 0.1))

		scene.add(new THREE.AmbientLight(0xcccccc, Math.PI))

		globe.current = new (Globe as any)()
		globe.current.globeMaterial().color.set(GCLR)
		globe.current.atmosphereColor('#666').atmosphereAltitude(0.1)

		// Configure arc rendering for comets
		globe.current
			.arcColor('color')
			.arcStroke('stroke')
			.arcAltitudeAutoScale(COMET_ARC_HEIGHT)
			.arcDashLength('dashLength')
			.arcDashGap('dashGap')
			.arcDashAnimateTime('dashAnimateTime')
			.arcDashInitialGap(1)
			.arcsTransitionDuration(0)

		scene.add(globe.current)

		fetch('/datasets/ne_110m_admin_0_countries.geojson')
			.then((r) => r.json())
			.then((g) =>
				globe.current
					.hexPolygonsData(g.features)
					.hexPolygonResolution(HEX)
					.hexPolygonMargin(0.35)
					.hexPolygonUseDots(true)
					.hexPolygonDotResolution(10)
					.hexPolygonColor(() => LAND),
			)

		const ctl = new TrackballControls(cam, r.domElement)
		ctl.noZoom = true
		ctl.noPan = true
		ctl.rotateSpeed = 5
		;(function loop() {
			globe.current.rotation.y += ROT
			ctl.update()
			comp.render()
			requestAnimationFrame(loop)
		})()
	}, [])

	/* update dots whenever changed */
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
	}, [dots])

	/* initial empty arc list */
	useEffect(() => {
		if (globe.current) refreshArcs()
	}, [])

	return <div ref={mount} style={{width: SIZE, height: SIZE, margin: '0 auto'}} />
}
