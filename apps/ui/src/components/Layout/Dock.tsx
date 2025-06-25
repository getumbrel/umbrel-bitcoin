import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {NavLink, useLocation} from 'react-router-dom'
import {motion} from 'framer-motion'

// We import SVGs as React components via `?react` (SVGR):
// This inlines the <svg>, so there’s no extra HTTP request.
// It also gives us the same behaviors as normal DOM elements—easy to size, recolor, and animate.
import HomeIcon from '@/assets/home.svg?react'
import InsightsIcon from '@/assets/insights.svg?react'
import SettingsIcon from '@/assets/settings.svg?react'

import {GradientBorderFromTop} from '@/components/shared/GradientBorders'

import {cn} from '@/lib/utils'

export default function Dock({className}: {className?: string}) {
	const {pathname} = useLocation()
	const activeTab = pathname.startsWith('/insights') ? 'insights' : pathname.startsWith('/settings') ? 'settings' : '/'

	return (
		<Tabs value={activeTab} className={cn('w-max', className)}>
			<TabsList className='relative flex rounded-full bg-dock-gradient py-6 px-1.5 backdrop-blur-2xl ring-white/6'>
				<GradientBorderFromTop />

				<DockTrigger value='/' to='/' Icon={HomeIcon} label='Home' active={activeTab === '/'} />
				<DockTrigger
					value='insights'
					to='/insights'
					Icon={InsightsIcon}
					label='Insights'
					active={activeTab === 'insights'}
				/>
				<DockTrigger
					value='settings'
					to='/settings'
					Icon={SettingsIcon}
					label='Settings'
					active={activeTab === 'settings'}
				/>
			</TabsList>
		</Tabs>
	)
}

function DockTrigger({
	value,
	to,
	Icon,
	label,
	active,
}: {
	value: string
	to: string
	Icon: React.FC<React.SVGProps<SVGSVGElement>>
	label: string
	active: boolean
}) {
	return (
		<TabsTrigger
			value={value}
			asChild
			className='cursor-pointer rounded-full py-4.5 px-3 data-[state=active]:bg-transparent transition-colors'
		>
			<NavLink
				to={to}
				className='group relative inline-flex items-center gap-1 rounded-full text-white/60 transition-colors data-[state=active]:text-white data-[state=active]:delay-[200ms]'
			>
				{/* This is the sliding pill that only exists inside the active trigger, and is used to create the illusion of a pill sliding between the tabs.*/}
				{active && (
					<motion.span
						layoutId='dock-pill'
						className='absolute inset-0 -z-10 rounded-full bg-[#252525]'
						transition={{type: 'tween', ease: 'easeInOut', duration: 0.2}}
					>
						<GradientBorderFromTop />
					</motion.span>
				)}

				{/* icon: only rendered when active, but animates in/out smoothly */}
				<motion.div
					layout
					initial={false}
					animate={active ? 'show' : 'hide'}
					variants={{
						show: {width: 18, opacity: 1, marginRight: 0},
						hide: {width: 0, opacity: 0, marginRight: 0},
					}}
					transition={{duration: 0.15}}
					className='overflow-hidden flex-shrink-0'
				>
					{active && <Icon className='h-[18px] w-[18px]' />}
				</motion.div>

				<span className='text-[12px] font-[400]'>{label}</span>
			</NavLink>
		</TabsTrigger>
	)
}
