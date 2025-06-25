import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
	plugins: [svgr(), react(), tailwindcss()],
	server: {
		proxy: {
			// any request starting with /api → http://localhost:3000
			'/api': {
				target: process.env['VITE_API_BASE'] || 'http://localhost:3000',
				changeOrigin: true,
				ws: true,
				rewrite: (path) => path, // keep /api/whatever as-is
			},
		},
	},
	// Shadcn requirement
	// https://ui.shadcn.com/docs/installation/vite
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'#settings': path.resolve(__dirname, '../../libs/settings/index.ts'),
			'#types': path.resolve(__dirname, '../../libs/shared-types/index.d.ts'),
		},
	},
})
