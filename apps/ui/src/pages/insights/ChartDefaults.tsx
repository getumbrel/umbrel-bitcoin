import type {CartesianGridProps, XAxisProps, YAxisProps} from 'recharts'

import {CardHeader, CardTitle, CardContent, CardFooter} from '@/components/ui/card'
import InsightCard from './InsightsCard'

export const DEFAULT_CHART_MARGIN = {top: 0, right: 20, bottom: 20, left: -10}

export const DEFAULT_GRID_PROPS: CartesianGridProps = {
	stroke: 'hsla(0,0%,48%,0.30)',
	strokeWidth: 0.5,
	strokeDasharray: '4 4',
}

export const makeXAxis = (label: string): Partial<XAxisProps> => ({
	axisLine: false,
	tickLine: false,
	tickMargin: 15,
	label: {value: label, position: 'bottom', offset: 10},
})

export const makeYAxis = (label: string): Partial<YAxisProps> => ({
	axisLine: false,
	tickLine: false,
	tickMargin: 5,
	tickFormatter: (v: number) => v.toFixed(0),
	label: {
		value: label,
		angle: -90,
	},
})

// TODO: add better loading placeholder
export function ChartLoadingPlaceholder({title, text}: {title: string; text?: string}) {
	return (
		<div className='flex items-center justify-center w-full aspect-video text-white/40'>
			<div className='flex flex-col items-center gap-3'>
				<div className='flex gap-1'>
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className='w-2 h-2 bg-white/20 rounded-full animate-pulse'
							style={{
								animationDelay: `${i * 0.2}s`,
								animationDuration: '1.5s',
							}}
						/>
					))}
				</div>
				<span className='text-sm'>{text ?? `Loading ${title.toLowerCase()} data...`}</span>
			</div>
		</div>
	)
}

interface ChartCardProps {
	title: string
	legend?: React.ReactNode
	children: React.ReactNode
	loading?: boolean
	syncing?: boolean
}

export function ChartCard({title, legend, children, loading, syncing}: ChartCardProps) {
	const placeholderText = syncing ? 'Your node is syncing… charts will appear once it is caught up.' : undefined
	return (
		<InsightCard>
			<CardHeader className='flex justify-between items-center px-4 md:px-6'>
				<CardTitle className='font-outfit text-white text-[20px] font-[400] pt-2'>{title}</CardTitle>
				{legend}
			</CardHeader>
			{/* No x padding on mobile. The recharts svg padding is enough to line up with card header px-4 above */}
			<CardContent className='px-0 md:px-6'>
				{loading || syncing ? <ChartLoadingPlaceholder title={title} text={placeholderText} /> : children}
			</CardContent>
			<CardFooter />
		</InsightCard>
	)
}
