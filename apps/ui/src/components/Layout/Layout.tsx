import {Outlet} from 'react-router-dom'

import Header from './Header'
import Dock from './Dock'
import Background from './Background'

// React Router injects the routed page in <Outlet/>.
export function Layout() {
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
				<main className='flex-1 min-h-0 overflow-y-auto overscroll-contain pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
					{/* Inner column has a max width of 768px to float within the viewport */}
					<div className='w-full max-w-screen-md mx-auto'>
						<Outlet />
					</div>
				</main>
			</div>
		</>
	)
}
