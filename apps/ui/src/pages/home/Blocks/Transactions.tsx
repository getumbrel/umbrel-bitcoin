import {useMemo, useRef} from 'react'
import * as THREE from 'three'
import {useFrame} from '@react-three/fiber'
import {useFBO} from '@react-three/drei'

import type {FeeTier} from '@umbrel-bitcoin/shared-types'

// Tetris grid parameters
const GRID_SIZE = 20 // Grid is 20x20

type TetrisSquare = {
	x: number
	y: number
	size: number
}

// Function to generate tetris squares from fee tiers
function generateTetrisSquaresFromTiers(tiers: FeeTier[]): TetrisSquare[] {
	const squares: TetrisSquare[] = []
	const grid: boolean[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
	
	// Sort tiers by square size (descending) to place larger squares first for better packing
	const sortedTiers = [...tiers].sort((a, b) => b.squareSize - a.squareSize)

	for (const tier of sortedTiers) {
		// Try to find the best position (top-most and leftmost that fits)
		let bestX = -1
		let bestY = -1
		let bestScore = Infinity
		
		// Scan the entire grid for the best position
		for (let y = 0; y <= GRID_SIZE - tier.squareSize; y++) {
			for (let x = 0; x <= GRID_SIZE - tier.squareSize; x++) {
				// Check if the square can fit at this position
				let canFit = true
				for (let dy = 0; dy < tier.squareSize && canFit; dy++) {
					for (let dx = 0; dx < tier.squareSize && canFit; dx++) {
						if (grid[y + dy][x + dx]) {
							canFit = false
						}
					}
				}
				
				if (canFit) {
					// Calculate a score for this position
					// Prefer top positions (lower y value) and leftmost positions
					// Also prefer positions that are supported (have filled cells below)
					let supportScore = 0
					
					// Check how many cells below this position are filled (better support = better score)
					if (y + tier.squareSize < GRID_SIZE) {
						for (let dx = 0; dx < tier.squareSize; dx++) {
							if (grid[y + tier.squareSize][x + dx]) {
								supportScore += 1
							}
						}
					} else {
						// Bottom of grid, maximum support
						supportScore = tier.squareSize
					}
					
					// Check how many cells to the left and right are filled (reduces holes)
					let adjacencyScore = 0
					if (x > 0) {
						for (let dy = 0; dy < tier.squareSize; dy++) {
							if (grid[y + dy][x - 1]) {
								adjacencyScore += 1
							}
						}
					}
					if (x + tier.squareSize < GRID_SIZE) {
						for (let dy = 0; dy < tier.squareSize; dy++) {
							if (grid[y + dy][x + tier.squareSize]) {
								adjacencyScore += 1
							}
						}
					}
					
					// Lower score is better
					// Prioritize: y position (top is better), then support, then adjacency, then x position
					const score = y * 1000 - supportScore * 100 - adjacencyScore * 10 + x
					
					if (score < bestScore) {
						bestScore = score
						bestX = x
						bestY = y
					}
				}
			}
		}
		
		if (bestX !== -1 && bestY !== -1) {
			// Place the square
			squares.push({
				x: bestX,
				y: bestY,
				size: tier.squareSize,
			})
			
			// Mark the grid cells as occupied
			for (let dy = 0; dy < tier.squareSize; dy++) {
				for (let dx = 0; dx < tier.squareSize; dx++) {
					grid[bestY + dy][bestX + dx] = true
				}
			}
		}
	}

	return squares
}

// Function to generate random tetris squares (fallback for when no tier data)
function generateRandomTetrisSquares(): TetrisSquare[] {
	const squares: TetrisSquare[] = []
	const grid: boolean[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
	const MIN_SQUARES = 30
	const MAX_SQUARES = 50
	const numSquares = Math.floor(Math.random() * (MAX_SQUARES - MIN_SQUARES + 1)) + MIN_SQUARES

	let placedSquares = 0
	let attempts = 0
	const maxAttempts = 1000

	while (placedSquares < numSquares && attempts < maxAttempts) {
		attempts++

		// Weighted size distribution for sizes 1-10
		// Smaller sizes are more common
		const sizeWeights = [30, 25, 20, 15, 10, 8, 6, 4, 2, 1]
		const totalWeight = sizeWeights.reduce((a, b) => a + b, 0)
		let random = Math.random() * totalWeight
		let size = 1

		for (let i = 0; i < sizeWeights.length; i++) {
			random -= sizeWeights[i]
			if (random <= 0) {
				size = i + 1
				break
			}
		}

		// Try to find the best position (top-most and leftmost that fits)
		let bestX = -1
		let bestY = -1
		let bestScore = Infinity

		// Scan the entire grid for the best position
		for (let y = 0; y <= GRID_SIZE - size; y++) {
			for (let x = 0; x <= GRID_SIZE - size; x++) {
				// Check if the square can fit at this position
				let canFit = true
				for (let dy = 0; dy < size && canFit; dy++) {
					for (let dx = 0; dx < size && canFit; dx++) {
						if (grid[y + dy][x + dx]) {
							canFit = false
						}
					}
				}
				
				if (canFit) {
					// Calculate a score for this position
					// Prefer top positions (lower y value) and leftmost positions
					// Also prefer positions that are supported (have filled cells below)
					let supportScore = 0
					
					// Check how many cells below this position are filled (better support = better score)
					if (y + size < GRID_SIZE) {
						for (let dx = 0; dx < size; dx++) {
							if (grid[y + size][x + dx]) {
								supportScore += 1
							}
						}
					} else {
						// Bottom of grid, maximum support
						supportScore = size
					}
					
					// Check how many cells to the left and right are filled (reduces holes)
					let adjacencyScore = 0
					if (x > 0) {
						for (let dy = 0; dy < size; dy++) {
							if (grid[y + dy][x - 1]) {
								adjacencyScore += 1
							}
						}
					}
					if (x + size < GRID_SIZE) {
						for (let dy = 0; dy < size; dy++) {
							if (grid[y + dy][x + size]) {
								adjacencyScore += 1
							}
						}
					}
					
					// Lower score is better
					// Prioritize: y position (top is better), then support, then adjacency, then x position
					const score = y * 1000 - supportScore * 100 - adjacencyScore * 10 + x
					
					if (score < bestScore) {
						bestScore = score
						bestX = x
						bestY = y
					}
				}
			}
		}

		if (bestX !== -1 && bestY !== -1) {
			squares.push({
				x: bestX,
				y: bestY,
				size,
			})

			// Mark the grid cells as occupied
			for (let dy = 0; dy < size; dy++) {
				for (let dx = 0; dx < size; dx++) {
					grid[bestY + dy][bestX + dx] = true
				}
			}

			placedSquares++
		}
	}

	return squares
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
	feeTiers,
}: {
	faceSize: number
	planeZ: number
	isHovered?: boolean
	feeTiers?: FeeTier[]
}) {
	const squares = useMemo(() => {
		if (feeTiers && feeTiers.length > 0) {
			return generateTetrisSquaresFromTiers(feeTiers)
		}
		return []
	}, [feeTiers])

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
		squares.forEach((square, index) => {
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
