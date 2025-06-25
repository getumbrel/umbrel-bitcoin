// Animation configuration for block transitions and effects
export const ANIMATION_CONFIG = {
	// Mouse tracking
	MAX_ROTATION: 0.15,
	FOLLOW_SPEED: 0.05,

	// Loading wave
	WAVE_AMPLITUDE: 0.2,
	WAVE_DELAY: 0.2,
	BOUNCE_DURATION: 0.4,
	PAUSE_AFTER_WAVE: 0.2,

	// Enhanced loading wave
	WAVE_BREATHING_SPEED: 0.3,
	WAVE_ROTATION_SPEED: 0.5,
	WAVE_ROTATION_AMOUNT: 0.05,
	PERLIN_SCALE: 0.5,
	PERLIN_TIME_SCALE: 0.2,

	// New block animation
	NEW_BLOCK_DURATION: 6,
	SLIDE_DURATION: 0.8,
	ENTRANCE_DELAY: 0,
	CASCADE_DELAY: 0.05,
	IMPACT_SCALE: 0.5,
	IMPACT_DURATION: 0.2,
	VALIDATION_DURATION: 1.5,
	SPIN_TO_FRONT_DURATION: 1.6,

	// Loading state
	LOADING_LIQUID_OPACITY: 0.6,
	BLOCK_COUNT_SPEED: 50, // blocks per second when catching up
} as const
