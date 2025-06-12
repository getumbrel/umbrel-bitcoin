import {Outlet, useLocation} from 'react-router-dom'

import Header from './Header'
import Dock from './Dock'
import Background from './Background'

import {usePrefetchInsights} from '@/hooks/usePrefetchInsights'
import {useBitcoindExitSocket} from '@/hooks/useBitcoindExitSocket'

// React Router injects the routed page in <Outlet/>.
export function Layout() {
	// Prefetch data for the insights page on first mount
	// Fires after the first paint, so it never delays a page's render or its own fetches
	usePrefetchInsights()

	// Listen for bitcoind exit events so we can show a toast notification if it crashes / has crashed
	useBitcoindExitSocket()

	const {pathname} = useLocation()
	const isSettingsPage = pathname.startsWith('/settings')

	return (
		<>
			{/* Moving gradient background. This is fixed to the full-viewport and never scrolls */}
			<Background />

			{/* The full-viewport, flex column div that contains the floating dock, header, and main content */}
			<div className='h-screen w-screen flex flex-col pt-6 px-4'>
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
