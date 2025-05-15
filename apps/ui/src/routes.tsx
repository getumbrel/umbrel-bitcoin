import {createBrowserRouter, createRoutesFromElements, Route} from 'react-router-dom'

import {Layout} from './components/Layout/Layout'
import HomePage from './pages/home/HomePage.tsx'
import InsightsPage from './pages/insights/InsightsPage.tsx'
import SettingsPage from './pages/settings/SettingsPage.tsx'

// TODO: think about how we want the Dock and scrolling to behave
// reserveDock:
// true  → Home-style: no scrolling, we just responsively contain the content to a single screen width/height
// false → Insights / Settings: content pane scrolls under Dock

export const router = createBrowserRouter(
	createRoutesFromElements(
		<>
			{/* Home Page - Content will never hide behind the Dock */}
			<Route element={<Layout reserveDock={true} />}>
				<Route index element={<HomePage />} />
			</Route>

			{/* Insights Page - Content will hide behind the Dock when overflowing */}
			<Route element={<Layout reserveDock={false} />}>
				<Route path='insights' element={<InsightsPage />} />
			</Route>

			{/* Settings Page - Content will hide behind the Dock when overflowing */}
			<Route element={<Layout reserveDock={false} />}>
				<Route path='settings' element={<SettingsPage />} />
			</Route>
		</>,
	),
)
