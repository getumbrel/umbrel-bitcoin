import {useMemo, useRef} from 'react'
import * as THREE from 'three'
import {useFrame} from '@react-three/fiber'
import {useFBO} from '@react-three/drei'

import type {BlockSummary} from '#types'

// Tetris grid parameters
const GRID_SIZE = 20 // Grid is 20x20

type TetrisSquare = {
	x: number
	y: number
	size: number
}

// Pack squares in a grid
function packSquares(squares: number[], gridSize: number): TetrisSquare[] {
	const placedSquares: TetrisSquare[] = []

	// Loop over all coords one by one for a given square size checking if it
	// can be placed and returning the coords once a position is found
	function findPosition(size: number) {
		for (let y = 0; y < gridSize; y++) {
			for (let x = 0; x < gridSize; x++) {
				const inBounds = x + size <= gridSize && y + size <= gridSize
				const isAvailable = !placedSquares.some(
					(square) =>
						x < square.x + square.size && x + size > square.x && y < square.y + square.size && y + size > square.y,
				)
				if (inBounds && isAvailable) return {x, y}
			}
		}
	}

	// Loop through squares, largest first
	for (const size of squares.sort().reverse()) {
		const position = findPosition(size)
		if (position) placedSquares.push({...position, size})
	}

	return placedSquares
}

// Custom shader material for golden gradient
const goldenGradientMaterial = new THREE.ShaderMaterial({
	uniforms: {
		uTime: {value: 0},
		gradientInvert: {value: 0.0}, // 0 = normal, 1 = inverted
	},
	vertexShader: `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: `
		varying vec2 vUv;
		uniform float uTime;
		uniform float gradientInvert;
		
		// Rounded rectangle SDF
		float roundedBoxSDF(vec2 p, vec2 size, float radius) {
			vec2 q = abs(p) - size + radius;
			return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
		}
		
		void main() {
			// Calculate rounded rectangle
			vec2 center = vUv - 0.5;
			float radius = 0.08; // Corner radius
			float box = roundedBoxSDF(center, vec2(0.5 - 0.02), radius);
			float alpha = 1.0 - smoothstep(0.0, 0.01, box);
			
			// Discard pixels outside rounded rectangle
			if (alpha < 0.01) discard;
			
			// Create diagonal gradient that rotates on hover
			// Calculate rotation angle based on hover state (0 to 90 degrees)
			float rotationAngle = gradientInvert * 1.5708; // 90 degrees in radians
			
			// Apply rotation to gradient direction
			vec2 baseDir = vec2(1.0, -1.0); // Base diagonal direction
			float cosAngle = cos(rotationAngle);
			float sinAngle = sin(rotationAngle);
			vec2 rotatedDir = vec2(
				baseDir.x * cosAngle - baseDir.y * sinAngle,
				baseDir.x * sinAngle + baseDir.y * cosAngle
			);
			
			// Calculate gradient with rotated direction
			float gradient = clamp(dot(vUv - vec2(0.5), normalize(rotatedDir)) + 0.5, 0.0, 1.0);
			
			// Create harder stops by quantizing the gradient
			float steps = 4.0; // Number of color bands
			gradient = floor(gradient * steps) / steps + (1.0 / (steps * 2.0));
			
			// Non-hover gradient colors
			vec3 darkRed = vec3(0.180, 0.027, 0.004); // #2E0701
			vec3 brightOrange = vec3(0.745, 0.212, 0.0); // #BE3600
			vec3 goldenYellow = vec3(0.933, 0.690, 0.027); // #EEB007
			
			// Hover gradient colors
			vec3 darkOrange = vec3(0.784, 0.357, 0.114); // #C85B1D
			vec3 brightYellow = vec3(0.992, 0.820, 0.0); // #FDD100
			vec3 paleYellow = vec3(1.0, 0.984, 0.769); // #FFFBC4
			
			// Mix colors based on hover state
			vec3 color1 = mix(darkRed, darkOrange, gradientInvert);
			vec3 color2 = mix(brightOrange, brightYellow, gradientInvert);
			vec3 color3 = mix(goldenYellow, paleYellow, gradientInvert);
			
			// Band thresholds
			// Non-hover: 60% dark, 30% bright, 10% golden
			// Hover: 30% dark, 50% bright, 20% pale
			float band1 = mix(0.4, 0.1, gradientInvert);
			float band2 = mix(0.9, 0.8, gradientInvert);
			
			// Create gradient with smooth transitions
			vec3 color;
			if (gradient < band1) {
				color = color1;
			} else if (gradient < band2) {
				color = mix(color1, color2, smoothstep(band1, band1 + 0.5, gradient));
			} else {
				color = mix(color2, color3, smoothstep(band2, band2 + 0.5, gradient));
			}
			
			// Remove the old separate golden shine code
			// Add subtle highlight edge
			float edgeGlow = 1.0 - smoothstep(0.0, 0.02, abs(box));
			color += vec3(edgeGlow * 0.1);
			
			// Add subtle inner shadow at bottom-right for depth
			float shadow = smoothstep(0.3, 0.8, distance(vUv, vec2(1.0, 0.0))) * mix(0.25, 0.15, gradientInvert);
			color *= (1.0 - shadow);
			
			gl_FragColor = vec4(color, alpha);
		}
	`,
	transparent: true,
})

// Blur shader material - Horizontal pass
const blurMaterialH = new THREE.ShaderMaterial({
	uniforms: {
		tDiffuse: {value: null},
		resolution: {value: new THREE.Vector2(512, 512)},
		blurSize: {value: 2.0},
	},
	vertexShader: `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: `
		uniform sampler2D tDiffuse;
		uniform vec2 resolution;
		uniform float blurSize;
		varying vec2 vUv;
		
		void main() {
			vec2 texelSize = 1.0 / resolution;
			vec4 color = vec4(0.0);
			float totalWeight = 0.0;
			
			// Smooth blur with more samples
			for(float i = -8.0; i <= 8.0; i += 1.0) {
				float weight = exp(-0.5 * pow(i / 4.0, 2.0));
				vec2 offset = vec2(i * texelSize.x * blurSize, 0.0);
				color += texture2D(tDiffuse, vUv + offset) * weight;
				totalWeight += weight;
			}
			
			gl_FragColor = color / totalWeight;
		}
	`,
	transparent: true,
})

// Blur shader material - Vertical pass
const blurMaterialV = new THREE.ShaderMaterial({
	uniforms: {
		tDiffuse: {value: null},
		resolution: {value: new THREE.Vector2(512, 512)},
		blurSize: {value: 2.0},
		brightness: {value: 0.5}, // 50% brightness
		opacity: {value: 1.0}, // Add opacity uniform
	},
	vertexShader: `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: `
		uniform sampler2D tDiffuse;
		uniform vec2 resolution;
		uniform float blurSize;
		uniform float brightness;
		uniform float opacity;
		varying vec2 vUv;
		
		void main() {
			vec2 texelSize = 1.0 / resolution;
			vec4 color = vec4(0.0);
			float totalWeight = 0.0;
			
			// Smooth blur with more samples and slight offset to break grid
			for(float i = -8.0; i <= 8.0; i += 1.0) {
				float weight = exp(-0.5 * pow(i / 4.0, 2.0));
				// Add tiny offset to break up grid patterns
				vec2 offset = vec2(0.0, (i + 0.1) * texelSize.y * blurSize);
				color += texture2D(tDiffuse, vUv + offset) * weight;
				totalWeight += weight;
			}
			
			color = color / totalWeight;
			
			// Apply brightness adjustment
			color.rgb *= brightness;
			
			// Apply opacity
			color.a *= opacity;
			
			gl_FragColor = color;
		}
	`,
	transparent: true,
})

// Component to render the block transactions tetris grid
export function Transactions({
	faceSize,
	planeZ,
	isHovered = false,
	block,
}: {
	faceSize: number
	planeZ: number
	isHovered?: boolean
	block: BlockSummary[]
}) {
	const squares = useMemo(() => {
		const squares = []
		for (const gridEntry of block?.transactionGrid ?? []) {
			for (let i = 0; i < gridEntry.numberOfBlocks; i++) squares.push(gridEntry.size)
		}

		return packSquares(squares, GRID_SIZE)
	}, [block])

	const cellSize = faceSize / GRID_SIZE
	const margin = 2 // 2px margin in screen space
	const marginInWorldSpace = margin * 0.001 // Convert to world space units

	const currentBlur = useRef(6.0)
	const currentBrightness = useRef(0.5)
	const currentGradientInvert = useRef(0.0)

	// Store material references
	const squareMaterials = useRef<THREE.ShaderMaterial[]>([])

	// Create render targets for multi-pass blur
	const renderTarget = useFBO(1024, 1024, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBAFormat,
		stencilBuffer: false,
		depthBuffer: false,
	})

	const renderTargetBlurH = useFBO(1024, 1024, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBAFormat,
		stencilBuffer: false,
		depthBuffer: false,
	})

	// Create separate scene for render target
	const rtScene = useMemo(() => new THREE.Scene(), [])
	const rtCamera = useMemo(() => {
		const cam = new THREE.OrthographicCamera(-faceSize / 2, faceSize / 2, faceSize / 2, -faceSize / 2, 0.1, 10)
		cam.position.z = 5
		return cam
	}, [faceSize])

	// Create blur material instances
	const blurMaterialHInstance = useMemo(() => {
		const mat = blurMaterialH.clone()
		mat.uniforms['resolution'].value = new THREE.Vector2(1024, 1024)
		mat.uniforms['blurSize'].value = 6.0
		return mat
	}, [])

	const blurMaterialVInstance = useMemo(() => {
		const mat = blurMaterialV.clone()
		mat.uniforms['resolution'].value = new THREE.Vector2(1024, 1024)
		mat.uniforms['blurSize'].value = 6.0
		mat.uniforms['brightness'].value = 0.5
		mat.uniforms['opacity'].value = 1.0
		return mat
	}, [])

	// Populate render target scene with tetris squares
	useMemo(() => {
		// Clear existing children
		rtScene.clear()
		squareMaterials.current = []

		// Add squares to render target scene
		squares.forEach((square, _index) => {
			const posX = (square.x + square.size / 2) * cellSize - faceSize / 2
			const posY = faceSize / 2 - (square.y + square.size / 2) * cellSize
			const squareSize = square.size * cellSize - marginInWorldSpace * 2

			const geometry = new THREE.PlaneGeometry(squareSize, squareSize)
			const material = goldenGradientMaterial.clone()
			const mesh = new THREE.Mesh(geometry, material)
			mesh.position.set(posX, posY, 0)

			// Store material reference
			squareMaterials.current.push(material)

			rtScene.add(mesh)
		})
	}, [squares, cellSize, faceSize, marginInWorldSpace, rtScene])

	// Create blur scenes
	const blurSceneH = useMemo(() => {
		const scene = new THREE.Scene()
		const plane = new THREE.Mesh(new THREE.PlaneGeometry(faceSize, faceSize), blurMaterialHInstance)
		scene.add(plane)
		return scene
	}, [faceSize, blurMaterialHInstance])

	// Render to texture before main render
	useFrame((state, delta) => {
		// Smooth transitions
		const targetBlur = isHovered ? 3.0 : 10
		const targetBrightness = isHovered ? 1 : 1
		const targetGradientInvert = isHovered ? 1.0 : 0.0

		// Ease the values
		const easeFactor = 1 - Math.pow(0.01, delta) // Smooth easing
		currentBlur.current += (targetBlur - currentBlur.current) * easeFactor
		currentBrightness.current += (targetBrightness - currentBrightness.current) * easeFactor
		currentGradientInvert.current += (targetGradientInvert - currentGradientInvert.current) * easeFactor

		// Update shader uniforms
		blurMaterialHInstance.uniforms['blurSize'].value = currentBlur.current
		blurMaterialVInstance.uniforms['blurSize'].value = currentBlur.current
		blurMaterialVInstance.uniforms['brightness'].value = currentBrightness.current

		// Update gradient inversion for all square materials
		squareMaterials.current.forEach((material) => {
			material.uniforms['gradientInvert'].value = currentGradientInvert.current
		})

		// Store current render target
		const currentRenderTarget = state.gl.getRenderTarget()

		// Render tetris squares to first texture
		state.gl.setRenderTarget(renderTarget)
		state.gl.clear()
		state.gl.render(rtScene, rtCamera)

		// Horizontal blur pass
		blurMaterialHInstance.uniforms['tDiffuse'].value = renderTarget.texture
		state.gl.setRenderTarget(renderTargetBlurH)
		state.gl.clear()
		state.gl.render(blurSceneH, rtCamera)

		// Update final material with horizontally blurred texture
		blurMaterialVInstance.uniforms['tDiffuse'].value = renderTargetBlurH.texture

		// Restore render target
		state.gl.setRenderTarget(currentRenderTarget)
	})

	return (
		<mesh position={[0, 0, planeZ + 0.01]}>
			<planeGeometry args={[faceSize, faceSize]} />
			<primitive object={blurMaterialVInstance} attach='material' />
		</mesh>
	)
}
