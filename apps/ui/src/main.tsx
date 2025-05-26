import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'

import preloadFonts from './lib/preload-fonts'

import App from './App.tsx'
import './index.css'

// Pre-load fonts so the very first paint uses them,
// eliminating the brief “fallback-font → actual-font” re-flow on page load.
preloadFonts()

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
