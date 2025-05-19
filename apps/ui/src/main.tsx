import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import preloadFonts from './lib/preload-fonts'

import App from './App.tsx'
import './index.css'

// Pre-load fonts so the very first paint uses them,
// eliminating the brief “fallback-font → actual-font” re-flow on page load.
preloadFonts()

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<App />
		</QueryClientProvider>
	</StrictMode>,
)
