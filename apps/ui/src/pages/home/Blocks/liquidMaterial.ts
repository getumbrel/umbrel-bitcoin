import * as THREE from 'three'
import {liquidVertexShader, liquidFragmentShader} from './liquidShader'

// Factory function to create liquid shader material
export const createLiquidMaterial = () =>
	new THREE.ShaderMaterial({
		uniforms: {
			uTime: {value: 0},
			uColorProgress: {value: 0},
			uOpacity: {value: 0},
		},
		vertexShader: liquidVertexShader,
		fragmentShader: liquidFragmentShader,
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
	})
