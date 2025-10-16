// @ts-nocheck
import {Outlet, useLocation} from 'react-router-dom'
import {useEffect, useRef, useState} from 'react'
import {motion, useScroll, useTransform} from 'framer-motion'
import {ErrorBoundary} from 'react-error-boundary'
import ErrorFallback from '../shared/ErrorFallback'

import Header from './Header'
import Dock from './Dock'
import Background from './Background'

import {cn} from '@/lib/utils'
import {usePrefetchInsights} from '@/hooks/usePrefetchInsights'
import {useBitcoindExitSocket} from '@/hooks/useBitcoindExitSocket'

// React Router injects the routed page in <Outlet/>.
export function Layout() {
	const mainRef = useRef<HTMLElement>(null)
	const [isAtTop, setIsAtTop] = useState(true)

	const {pathname} = useLocation()
	const isSettingsPage = pathname.startsWith('/settings')

	// Map scroll progress of <main/> to a simple fade opacity (0 -> 1 over first ~3% scroll)
	const {scrollYProgress} = useScroll({container: mainRef})
	const fadeOpacity = useTransform(scrollYProgress, [0, 0.03], [0, 1])

	// Prefetch data for the insights page on first mount
	// Fires after the first paint, so it never delays a page's render or its own fetches
	usePrefetchInsights()

	// Listen for bitcoind exit events so we can show a toast notification if it crashes / has crashed
	useBitcoindExitSocket()

	// Reset <main/> scroll position on page change
	// Prevents unwanted scroll position on Settings page when Insights page has been scrolled
	useEffect(() => {
		if (mainRef.current) {
			mainRef.current.scrollTop = 0
			setIsAtTop(true)
		}
	}, [pathname])

	// Keep an explicit "at top" guard so the fade is hidden on initial load
	// and after route changes; it should only appear once the user scrolls.
	useEffect(() => {
		const el = mainRef.current
		if (!el) return
		const onScroll = () => setIsAtTop(el.scrollTop <= 1)
		onScroll()
		el.addEventListener('scroll', onScroll, {passive: true})
		return () => el.removeEventListener('scroll', onScroll)
	}, [])

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
				<main
					ref={mainRef}
					className={cn(
						// Base scroll container styles; visually hide scrollbars
						// Reserve bottom space for the floating Dock (including safe-area for iOS bars/notches)
						'flex-1 min-h-0 overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-[calc(var(--dock-clearance)+env(safe-area-inset-bottom))]',
						// Settings page is non-scrollable (content handles its own overflow), while the other pages scroll
						isSettingsPage ? 'overflow-hidden' : 'overflow-y-auto',
					)}
				>
					{/* Top fade right below the header - only appears when scrolled */}
					<motion.div
						className='pointer-events-none sticky top-0 h-12 -mt-12 z-10'
						style={{
							background: 'linear-gradient(to bottom, #000 0%, transparent 100%)',
							opacity: isAtTop ? 0 : fadeOpacity,
						}}
					/>

					{/* Inner column has a max width of 768px to float within the viewport */}
					<div className='w-full max-w-screen-md mx-auto'>
						{/* We wrap the routed page in an ErrorBoundary to catch unexpected render-time errors */}
						{/* We still show header and dock, but the content is replaced by the ErrorFallback. */}
						<ErrorBoundary resetKeys={[pathname]} fallbackRender={() => <ErrorFallback />}>
							<Outlet />
						</ErrorBoundary>
					</div>
				</main>

				{/* Bottom fade overlay fixed to viewport bottom (Dock sits over it)*/}
				<div
					className='pointer-events-none fixed inset-x-0 bottom-0 h-12 z-20'
					style={{background: 'linear-gradient(to top, #000 0%, transparent 100%)'}}
				/>
			</div>
		</>
	)
}
