import {useDeferredValue, useId} from 'react'
import {AreaChart, CartesianGrid, XAxis, YAxis, Area} from 'recharts'
import {formatDistanceStrict} from 'date-fns'

import {ChartContainer, ChartTooltip} from '@/components/ui/chart'

import {ChartCard, DEFAULT_CHART_MARGIN, DEFAULT_GRID_PROPS, makeXAxis, makeYAxis} from './ChartDefaults'
import {sliceLast24h, findClosestDataPoint, calculateHoursAgo, hoursToMs} from '@/lib/chartHelpers'

import {useFeeRates} from '@/hooks/useFeeRates'
import {useSyncStatus} from '@/hooks/useSyncStatus'
import {syncStage} from '@/lib/sync-progress'

const SERIES = {
	p50: {label: '50th-percentile', color: 'hsl(29 100% 51%)'},
} as const

export default function FeeRateChart() {
	// IDs for the data series gradients
	const fillId = useId()
	const strokeId = useId()

	// Deterine if we're still in IBD (we won't query for data in IBD)
	const {data: syncStatus} = useSyncStatus()
	const stage = syncStage(syncStatus)
	const inIBD = stage !== 'synced' // 'pre-headers' | 'headers' | 'IBD'

	// 144 blocks is exactly 24 hours at 1 block per 10 min.
	// 200 blocks ensures we have 24 hours of data even at worst-case historical block times
	const {data: raw = [], isLoading} = useFeeRates(200, {enabled: !inIBD})

	// slice the last 24 hours of data
	const {slice} = sliceLast24h(raw)

	const chartData = slice.map((p) => ({
		block: p.height,
		hoursAgo: calculateHoursAgo(p.time),
		p10: p.p10,
		p50: p.p50,
		p90: p.p90,
	}))

	// Defer the data to avoid blocking the main thread and allow the chart to render immediately and the dock tab to animate smoothly
	const deferredData = useDeferredValue(chartData)

	return (
		<ChartCard title='Median Fee Rate' loading={isLoading} syncing={inIBD}>
			<ChartContainer config={SERIES}>
				<AreaChart data={deferredData} margin={DEFAULT_CHART_MARGIN}>
					{/* Gradient definitions */}
					<defs>
						{/* Gradient under the curve */}
						<linearGradient id={fillId} x1='0' y1='0' x2='0' y2='1'>
							<stop offset='0%' stopColor='hsla(29,100%,51%,0.30)' />
							<stop offset='100%' stopColor='hsla(29,100%,51%,0.02)' />
						</linearGradient>

						{/* Stroke gradient for the line: white at the top of the chart, orange lower down */}
						<linearGradient id={strokeId} gradientUnits='userSpaceOnUse' x1='0' x2='0' y1='100%' y2='0'>
							<stop offset='0%' stopColor='hsla(29, 100%, 51%, 0.3)' />
							<stop offset='70%' stopColor='hsla(29, 100%, 51%, 1)' />
							<stop offset='100%' stopColor='hsla(0, 0%, 100%, 1)' />
						</linearGradient>
					</defs>

					{/* TODO: modularize this tooltip */}
					<ChartTooltip
						cursor={false}
						wrapperStyle={{outline: 'none'}} // remove default focus ring
						content={({active, payload}) => {
							if (!active || !payload?.length) return null

							const d = payload[0].payload
							const ageMs = hoursToMs(d.hoursAgo)

							return (
								<div className='rounded-md border border-white/10 bg-black/90 p-2 text-[12px] text-white'>
									{/* Tooltip header*/}
									<div className='border-b border-white/10 pb-1 mb-1'>
										{/* Block height*/}
										<div className='flex items-center gap-2 '>
											<span className='text-white/60'>Block</span>
											<span className='ml-auto font-mono tabular-nums'>{d.block}</span>
										</div>

										{/* Age (hours ago) */}
										<div className='flex items-center gap-2'>
											<span className='text-white/60'>Age</span>
											<span className='ml-auto font-mono tabular-nums'>{formatDistanceStrict(0, ageMs)}</span>
										</div>
									</div>

									{/* Fee Rate */}
									<div className='flex items-center gap-2'>
										<span className='text-white/60'>Median Fee Rate</span>
										<span className='ml-auto font-mono tabular-nums text-[#FF7E05]'>{d.p50} sat/vB</span>
									</div>
								</div>
							)
						}}
					/>

					{/* axes / grid / data */}
					<CartesianGrid {...DEFAULT_GRID_PROPS} />

					<YAxis {...makeYAxis('sat/vB')} domain={[0, (dataMax: number) => Math.ceil(dataMax) + 1]} />

					{/* Main x-axis that we plot against (hours-ago) */}
					<XAxis
						// {...makeXAxis(`Blocks ${minBlock?.toLocaleString()} – ${maxBlock?.toLocaleString()} (last 24h)`)}
						{...makeXAxis('')}
						type='number'
						dataKey='hoursAgo'
						domain={[24, 0]}
						ticks={[24, 18, 12, 6, 0]}
						tickFormatter={(h) => (h === 0 ? 'now' : `-${h} h`)}
						reversed
					/>

					{/* Secondary x-axis that shows block-height labels */}
					<XAxis
						orientation='bottom'
						xAxisId='height'
						type='number'
						// reuses the same scale as the "hours-ago" axis
						dataKey='hoursAgo'
						// only show ticks at 24, 18, 12, and 6 hours ago, not 0
						ticks={[24, 18, 12, 6]}
						// map each tick's hours-ago value to the nearest datapoint's block-height for a pseudo-accurate label
						tickFormatter={(h) => {
							const closest = findClosestDataPoint(deferredData, h, (item) => item.hoursAgo)
							return closest?.block ? Number(closest.block).toLocaleString() : ''
						}}
						axisLine={false}
						tickLine={false}
						reversed
					/>

					<Area
						dataKey='p50'
						type='monotone'
						/* gradient under the curve */
						fill={`url(#${fillId})`}
						fillOpacity={1}
						/* gradient of the line */
						stroke={`url(#${strokeId})`}
						strokeWidth={1.25}
						isAnimationActive={false}
					/>
				</AreaChart>
			</ChartContainer>
		</ChartCard>
	)
}
