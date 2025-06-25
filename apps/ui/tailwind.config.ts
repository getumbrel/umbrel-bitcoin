import type {Config} from 'tailwindcss'

export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,mdx}'],
	theme: {
		extend: {
			fontFamily: {
				dmSans: ['DM Sans Variable', 'sans-serif'],
				outfit: ['Outfit Variable', 'sans-serif'],
			},
			backgroundImage: {
				'card-gradient': 'linear-gradient(to bottom, hsla(0,0%,6%,1), hsla(0,0%,3%,1))',
				'text-gradient': 'linear-gradient(to bottom, hsla(0,0%,100%,1), hsla(0,0%,100%,0.64))',
				'button-gradient': 'linear-gradient(to bottom, hsla(0,0%,11%,1), hsla(0,0%,9%,1))',
				'dock-gradient': 'linear-gradient(to bottom, hsla(0,0%,10%,1), hsla(0,0%,5%,1))',
			},
		},
	},
	plugins: [],
} satisfies Config
