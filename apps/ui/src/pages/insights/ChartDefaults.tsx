import type {CartesianGridProps, XAxisProps, YAxisProps} from 'recharts'
import type {ValueType, NameType} from 'recharts/types/component/DefaultTooltipContent'

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

export const makeTooltip =
	(series: Record<string, {label: string; color: string}>) =>
	(value: ValueType, name: NameType): React.ReactNode => {
		// coerce back to string so we can index our map safely
		const key = String(name)
		const {label, color} = series[key]

		return (
			<div className='flex items-center gap-2'>
				<div className='h-2 w-2 rounded-[2px]' style={{backgroundColor: color}} />
				<span className='text-white/60'>{label}</span>
				<span className='text-white font-mono font-medium tabular-nums ml-auto'>{Number(value).toLocaleString()}</span>
			</div>
		)
	}

interface Props {
	title: string
	legend?: React.ReactNode
	children: React.ReactNode
}

export function ChartCard({title, legend, children}: Props) {
	return (
		<InsightCard>
			<CardHeader className='flex justify-between items-center'>
				<CardTitle className='font-outfit text-white text-[20px] font-[400] pt-2'>{title}</CardTitle>
				{legend}
			</CardHeader>

			<CardContent>{children}</CardContent>
			<CardFooter />
		</InsightCard>
	)
}
