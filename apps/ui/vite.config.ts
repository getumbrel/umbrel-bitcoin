import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			// any request starting with /api → http://localhost:3000
			'/api': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				ws: true,
				rewrite: (path) => path, // keep /api/whatever as-is
			},
		},
	},
})
