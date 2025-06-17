// Liquid shader for validation and loading effects
export const liquidVertexShader = `
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`

export const liquidFragmentShader = `
	uniform float uTime;
	uniform float uColorProgress;
	uniform float uOpacity;
	varying vec2 vUv;
	
	vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
	vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
	vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
	
	float snoise(vec2 v) {
		const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
		vec2 i  = floor(v + dot(v, C.yy));
		vec2 x0 = v - i + dot(i, C.xx);
		vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
		vec4 x12 = x0.xyxy + C.xxzz;
		x12.xy -= i1;
		i = mod289(i);
		vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
		vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
		m = m*m;
		m = m*m;
		vec3 x = 2.0 * fract(p * C.www) - 1.0;
		vec3 h = abs(x) - 0.5;
		vec3 ox = floor(x + 0.5);
		vec3 a0 = x - ox;
		m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
		vec3 g;
		g.x  = a0.x  * x0.x  + h.x  * x0.y;
		g.yz = a0.yz * x12.xz + h.yz * x12.yw;
		return 130.0 * dot(m, g);
	}
	
	float turbulence(vec2 st, float time) {
		float value = 0.0;
		float amplitude = 1.0;
		float frequency = 1.0;
		
		for (int i = 0; i < 4; i++) {
			value += amplitude * abs(snoise(st * frequency + time));
			frequency *= 2.0;
			amplitude *= 0.5;
		}
		
		return value;
	}
	
	void main() {
		vec2 st = vUv;
		vec2 pos = st - 0.5;
		
		float t1 = turbulence(st * 3.0 + vec2(uTime * 0.3, -uTime * 0.2), uTime * 0.1);
		float t2 = turbulence(st * 5.0 - vec2(uTime * 0.2, uTime * 0.3), uTime * 0.15);
		float t3 = snoise(st * 8.0 + vec2(uTime * 0.5, 0.0));
		
		float pattern = t1 * 0.5 + t2 * 0.3 + t3 * 0.2;
		
		vec2 distortedPos = pos + vec2(
			sin(t1 * 3.14159 + uTime) * 0.1,
			cos(t2 * 3.14159 + uTime) * 0.1
		);
		
		float dist = length(distortedPos);
		float shape = smoothstep(0.5, 0.1, dist + pattern * 0.3);
		
		float tendrils = abs(sin(atan(distortedPos.y, distortedPos.x) * 5.0 + uTime * 2.0 + pattern * 2.0));
		tendrils = pow(tendrils, 3.0) * smoothstep(0.5, 0.2, dist);
		
		float finalShape = shape + tendrils * 0.3;
		finalShape *= 0.8 + sin(uTime * 3.0 + pattern) * 0.2;
		
		vec3 darkRed = vec3(0.180, 0.027, 0.004);
		vec3 brightOrange = vec3(0.745, 0.212, 0.0);
		vec3 greenColor = vec3(0.2, 1.0, 0.3);
		
		vec3 validationColor = mix(darkRed, brightOrange, 0.5 + pattern * 0.5);
		vec3 baseColor = mix(validationColor, greenColor, uColorProgress);
		
		vec3 color = baseColor * (1.0 + pattern * 0.2);
		
		gl_FragColor = vec4(color * 2.5, finalShape * uOpacity);
	}
`
