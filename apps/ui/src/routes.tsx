import {createBrowserRouter, createRoutesFromElements, Route} from 'react-router-dom'

import {Layout} from './components/Layout/Layout'
import HomePage from './pages/home'
import InsightsPage from './pages/insights'
import SettingsPage from './pages/settings'

// Each page is rendered inside the <Outlet /> of <Layout>
// Header and floating Dock are shared across all pages
export const router = createBrowserRouter(
	createRoutesFromElements(
		<Route element={<Layout />}>
			<Route index element={<HomePage />} />
			<Route path='insights' element={<InsightsPage />} />
			<Route path='settings' element={<SettingsPage />} />
		</Route>,
	),
)
