// Pre-load fonts so the very first paint uses them,
// eliminating the brief fallback-font → actual-font re-flow on page load.

import outfit from '@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2?url'
import dmSans from '@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2?url'
/* TODO: import dm-mono */

function preload(href: string) {
	const link = Object.assign(document.createElement('link'), {
		rel: 'preload',
		href,
		as: 'font',
		type: 'font/woff2',
		crossOrigin: 'anonymous',
	})
	document.head.appendChild(link)
}

export default function preloadFonts() {
	;[outfit, dmSans].forEach(preload)
}
