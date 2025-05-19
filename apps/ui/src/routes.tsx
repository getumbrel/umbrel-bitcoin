import {createBrowserRouter, createRoutesFromElements, Route} from 'react-router-dom'

import {Layout} from './components/Layout/Layout'
import HomePage from './pages/home'
import InsightsPage from './pages/insights'
import SettingsPage from './pages/settings'

// Each page is rendered inside the <Outlet /> of <Layout>
// Header and floating Dock are shared across all pages
export const router = createBrowserRouter(
	createRoutesFromElements(
		<>
			{/* Home Page */}
			<Route element={<Layout />}>
				<Route path='/' index element={<HomePage />} />
			</Route>

			{/* Insights Page */}
			<Route element={<Layout />}>
				<Route path='insights' element={<InsightsPage />} />
			</Route>

			{/* Settings Page */}
			<Route element={<Layout />}>
				<Route path='settings' element={<SettingsPage />} />
			</Route>
		</>,
	),
)
