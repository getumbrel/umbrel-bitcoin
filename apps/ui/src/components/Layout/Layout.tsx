import {Outlet} from 'react-router-dom'

import Header from './Header'
import Dock from './Dock'
// import Background from './Background'

// React Router injects the routed page in <Outlet/>.
export function Layout() {
	return (
		<>
			{/* Moving gradient background. This is full-viewport and never scrolls */}
			{/* <Background /> */}

			{/* The full-viewport, flex column div that contains the floating dock, header, and main content */}
			<div className='h-screen w-screen flex flex-col items-center pt-6 px-4 bg-black'>
				{/* Floating dock; content scrolls under it */}
				<Dock className='fixed bottom-4 left-1/2 -translate-x-1/2 z-30' />

				{/* Header at the very top */}
				<Header className='w-full max-w-screen-md' />

				{/* Main content fills the leftover space and is scrollable within the container */}
				{/* TODO: implement a scroll fade */}
				<main className='flex-1 min-h-0 w-full max-w-screen-md overflow-y-auto overscroll-contain pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden '>
					<Outlet />
				</main>
			</div>
		</>
	)
}
