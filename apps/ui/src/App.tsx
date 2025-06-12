import {RouterProvider} from 'react-router-dom'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {Toaster} from '@/components/ui/sonner'

import {router} from '@/routes'

const queryClient = new QueryClient()

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
			{/* App-wide toast notifications */}
			<Toaster richColors position='top-right' />
		</QueryClientProvider>
	)
}
