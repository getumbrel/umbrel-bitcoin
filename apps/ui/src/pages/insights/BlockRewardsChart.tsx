import {useDeferredValue, useId} from 'react'
import {BarChart, Bar, CartesianGrid, XAxis, YAxis} from 'recharts'
import {formatDistanceStrict} from 'date-fns'

import {ChartContainer, ChartTooltip} from '@/components/ui/chart'

import {ChartCard, DEFAULT_GRID_PROPS, DEFAULT_CHART_MARGIN, makeXAxis, makeYAxis} from './ChartDefaults'
import {sliceLast24h, calculateHoursAgo, hoursToMs, satsToBTC} from '@/lib/chartHelpers'

import {useBlockRewards} from '@/hooks/useBlockRewards'
import {syncStage} from '@/lib/sync-progress'
import {useSyncStatus} from '@/hooks/useSyncStatus'

const SERIES = {
	subsidy: {label: 'Subsidy', color: 'hsla(29,100%,51%,0.44)'},
	fees: {label: 'Fees', color: '#FF7E05'},
} as const

export default function RewardsChart() {
	// ID for the data series gradient
	const fillId = useId()

	// Deterine if we're still in IBD (we won't query for data in IBD)
	const {data: syncStatus} = useSyncStatus()
	const stage = syncStage(syncStatus)
	const inIBD = stage !== 'synced' // 'pre-headers' | 'headers' | 'IBD'

	// 144 blocks is exactly 24 hours at 1 block per 10 min.
	// 200 blocks ensures we have 24 hours of data even at worst-case historical block times
	const {data: raw = [], isLoading} = useBlockRewards(200, {enabled: !inIBD})

	// slice the last 24 hours of data
	const {slice} = sliceLast24h(raw)

	const chartData = slice.map(({height, subsidySat, feesSat, time}) => ({
		block: height,
		hoursAgo: calculateHoursAgo(time),
		subsidyBTC: satsToBTC(subsidySat),
		feesBTC: satsToBTC(feesSat),
	}))

	// Defer the data to avoid blocking the main thread and allow the chart to render immediately and the dock tab to animate smoothly
	const deferredData = useDeferredValue(chartData)

	const legend = (
		<div className='flex items-center gap-4 text-white/60 text-[12px]'>
			{Object.entries(SERIES).map(([k, {label, color}]) => (
				<div key={k} className='flex items-center gap-2'>
					<div className='h-2 w-2 rounded-[2px]' style={{background: color}} />
					<span>{label}</span>
				</div>
			))}
		</div>
	)

	return (
		<ChartCard title='Block Rewards' legend={legend} loading={isLoading} syncing={inIBD}>
			<ChartContainer config={SERIES}>
				<BarChart data={deferredData} margin={DEFAULT_CHART_MARGIN} barCategoryGap={1} barSize={6}>
					{/* Gradient definitions */}
					<defs>
						<linearGradient id={fillId} x1='0' y1='0' x2='0' y2='1'>
							<stop offset='0%' stopColor='rgba(255,126,5,0.44)' />
							<stop offset='86.44%' stopColor='rgba(255,126,5,0)' />
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

									{/* Rewards breakdown */}
									<div className='flex items-center gap-2'>
										<div className='h-2 w-2 rounded-[2px]' style={{backgroundColor: 'hsla(29,100%,51%,0.44)'}} />
										<span className='text-white/60'>Subsidy</span>
										<span className='ml-auto font-mono tabular-nums'>{d.subsidyBTC.toFixed(3)}</span>
									</div>

									<div className='flex items-center gap-2'>
										<div className='h-2 w-2 rounded-[2px]' style={{backgroundColor: '#FF7E05'}} />
										<span className='text-white/60'>Fees</span>
										<span className='ml-auto font-mono tabular-nums'>{d.feesBTC.toFixed(3)}</span>
									</div>
								</div>
							)
						}}
					/>

					{/* axes / grid / data */}
					<CartesianGrid {...DEFAULT_GRID_PROPS} />

					<YAxis {...makeYAxis('Bitcoin')} domain={[0, (dataMax: number) => Math.ceil(dataMax)]} />
					<XAxis
						{...makeXAxis(`Last 24h`)}
						dataKey='block'
						type='category'
						interval='preserveStartEnd'
						minTickGap={60}
						tickFormatter={(v) => Number(v).toLocaleString()}
					/>

					<Bar
						dataKey='subsidyBTC'
						stackId='a'
						fill={`url(#${fillId})`}
						// radius={[0, 0, 4, 4]}
						isAnimationActive={false}
						barSize={10}
					/>
					<Bar dataKey='feesBTC' stackId='a' fill='#FF7E05' radius={[2, 2, 0, 0]} isAnimationActive={false} />
				</BarChart>
			</ChartContainer>
		</ChartCard>
	)
}
