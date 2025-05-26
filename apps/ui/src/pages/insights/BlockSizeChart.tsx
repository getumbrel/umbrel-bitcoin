import {useDeferredValue, useId} from 'react'
import {AreaChart, CartesianGrid, XAxis, YAxis, Area} from 'recharts'
import prettyBytes from 'pretty-bytes'
import {formatDistanceStrict} from 'date-fns'

import {ChartContainer, ChartTooltip} from '@/components/ui/chart'

import {ChartCard, DEFAULT_CHART_MARGIN, DEFAULT_GRID_PROPS, makeXAxis, makeYAxis} from './ChartDefaults'
import {useBlockSize} from '@/hooks/useBlockSize'
import {sliceLast24h} from '@/lib/chartHelpers'

const SERIES = {
	sizeMB: {label: 'Size (MB)', color: '#FF7E05'},
} as const

export default function BlockSizeChart() {
	// IDs for the data series gradients
	const fillId = useId()
	const strokeId = useId()

	// 144 blocks is exactly 24 hours at 1 block per 10 min.
	// 200 blocks ensures we have 24 hours of data even at worst-case historical block times
	const {data: raw = []} = useBlockSize(200)

	// slice the last 24 hours of data
	const {slice, minBlock, maxBlock} = sliceLast24h(raw)

	const chartData = slice.map((p) => ({
		block: p.height.toString(),
		hoursAgo: (Date.now() / 1000 - p.time) / 3600,
		sizeMB: p.sizeBytes / 1_000_000,
	}))

	// Defer the data to avoid blocking the main thread and allow the chart to render immediately and the dock tab to animate smoothly
	const deferredData = useDeferredValue(chartData)

	return (
		<ChartCard title='Block Size'>
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

							const d = payload[0].payload // what you already map out
							const ageMs = d.hoursAgo * 3_600_000 // convert h → ms once

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

									{/* Block Size */}
									<div className='flex items-center gap-2'>
										<span className='text-white/60'>Size</span>
										<span className='ml-auto font-mono tabular-nums text-[#FF7E05]'>
											{prettyBytes(d.sizeMB * 1_000_000, {maximumFractionDigits: 2})}
										</span>
									</div>
								</div>
							)
						}}
					/>

					{/* axes / grid / data */}
					<CartesianGrid {...DEFAULT_GRID_PROPS} />

					<YAxis {...makeYAxis('MB')} domain={[0, (dataMax: number) => Math.ceil(dataMax)]} />
					<XAxis
						{...makeXAxis(`Blocks ${minBlock?.toLocaleString()} – ${maxBlock?.toLocaleString()}`)}
						type='number'
						dataKey='hoursAgo'
						domain={[24, 0]}
						ticks={[24, 18, 12, 6, 0]}
						tickFormatter={(h) => `-${h} h`}
						reversed
					/>

					<Area
						dataKey='sizeMB'
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
