import {Outlet, useLocation} from 'react-router-dom'
import {useEffect, useRef} from 'react'

import Header from './Header'
import Dock from './Dock'
import Background from './Background'

import {usePrefetchInsights} from '@/hooks/usePrefetchInsights'
import {useBitcoindExitSocket} from '@/hooks/useBitcoindExitSocket'

// React Router injects the routed page in <Outlet/>.
export function Layout() {
	const mainRef = useRef<HTMLElement>(null)

	const {pathname} = useLocation()
	const isSettingsPage = pathname.startsWith('/settings')

	// Reset scroll position on page change
	// Prevents unwanted scroll position on Settings page when Insights page has been scrolled
	useEffect(() => {
		if (mainRef.current) {
			mainRef.current.scrollTop = 0
		}
	}, [pathname])

	// Prefetch data for the insights page on first mount
	// Fires after the first paint, so it never delays a page's render or its own fetches
	usePrefetchInsights()

	// Listen for bitcoind exit events so we can show a toast notification if it crashes / has crashed
	useBitcoindExitSocket()

	return (
		<>
			{/* Moving gradient background. This is fixed to the full-viewport and never scrolls */}
			<Background />

			{/* The full-viewport, flex column div that contains the floating dock, header, and main content */}
			{/* We're using dvh (Dynamic Viewport Height) units throughout to ensure the layout is responsive and doesn't have white space at the bottom on browsers that have a dynamic address bar (like iOS Safari) */}
			<div className='h-[100dvh] w-[100vw] flex flex-col pt-6 px-4'>
				{/* Floating dock – stays on top so content scrolls under it */}
				<Dock className='fixed bottom-4 left-1/2 -translate-x-1/2 z-30' />

				{/* Header at the very top */}
				<header className='flex justify-center'>
					<Header className='w-full max-w-screen-md' />
				</header>

				{/* Main content below the header */}
				{/* The outer scroll container is the full width of the viewport so that scrolling can be triggered outside of the inner floating column */}
				{/* TODO: implement a scroll fade */}
				<main
					ref={mainRef}
					className={`flex-1 min-h-0 overscroll-contain pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
						isSettingsPage ? 'overflow-hidden' : 'overflow-y-auto'
					}`}
				>
					{/* Inner column has a max width of 768px to float within the viewport */}
					<div className='w-full max-w-screen-md mx-auto'>
						<Outlet />
					</div>
				</main>
			</div>
		</>
	)
}
