import {Outlet} from 'react-router-dom'

import Header from './Header'
import Dock from './Dock'

// React Router injects the routed page in <Outlet/>.
export function Layout() {
	return (
		<div className='min-h-screen w-screen flex flex-col items-center p-4 bg-black'>
			<div className='w-full max-w-screen-xl flex flex-col flex-1 bg-white'>
				<Header />

				<main className='flex-1'>
					<Outlet />
				</main>

				<Dock />
			</div>
		</div>
	)
}
