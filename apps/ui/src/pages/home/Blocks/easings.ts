// Easing functions for smooth animations
export const easings = {
	outQuint: (t: number) => 1 - Math.pow(1 - t, 5),

	outBack: (t: number) => {
		const c1 = 1.70158
		const c3 = c1 + 1
		return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
	},

	inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,

	outExpo: (t: number) => {
		// Handle values very close to 1 to prevent discontinuity
		if (t >= 0.999) return 1
		return 1 - Math.pow(2, -10 * t)
	},
} as const
