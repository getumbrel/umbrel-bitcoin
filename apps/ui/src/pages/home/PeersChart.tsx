import {useState} from 'react'
import {PieChart, Pie, Cell, Label, Sector, type PieProps} from 'recharts'

import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card'
import {ChartContainer, type ChartConfig} from '@/components/ui/chart'
import {usePeerCount} from '@/hooks/usePeers'

const chartConfig = {
	clearnet: {label: 'Clearnet', color: 'hsl(29 100% 51%)'},
	tor: {label: 'Tor', color: 'hsl(29 100% 30%)'},
	i2p: {label: 'I2P', color: 'hsl(29 100% 15%)'},
} satisfies ChartConfig

// Active slice when hovering over the chart
// We increase the size of the slice outwards slightly and add a glow effect
const renderActiveSlice: PieProps['activeShape'] = (props: any) => {
	const {cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill} = props
	return (
		<Sector
			cx={cx}
			cy={cy}
			innerRadius={innerRadius - 0}
			outerRadius={outerRadius + 3} // small pop outwards
			startAngle={startAngle}
			endAngle={endAngle}
			cornerRadius={4}
			fill={fill}
			style={{filter: `drop-shadow(0 0 4px ${fill})`}} // glow effect
		/>
	)
}

export default function PeersChart() {
	const {data} = usePeerCount()

	// Active slice when hovering over the chart
	const [activeIndex, setActiveIndex] = useState<number | null>(null)

	// create buckets for each network
	const torTotal = data?.byNetwork['onion']?.total ?? 0
	const i2pTotal = data?.byNetwork['i2p']?.total ?? 0
	const clearnetTotal = Object.entries(data?.byNetwork ?? {}).reduce(
		(acc, [key, bucket]) => (key === 'onion' || key === 'i2p' ? acc : acc + bucket?.total),
		0,
	)

	const totalPeers = data?.total ?? 0

	const chartData = [
		{network: 'clearnet', total: clearnetTotal, color: chartConfig.clearnet.color},
		{network: 'tor', total: torTotal, color: chartConfig.tor.color},
		{network: 'i2p', total: i2pTotal, color: chartConfig.i2p.color},
	]

	// If total peers are 0 we show a placeholder slice so the donut chart shows up.
	const displayData = totalPeers === 0 ? [{network: 'placeholder', total: 1, color: 'hsl(0 0% 20%)'}] : chartData

	// Disable donut slice interactions when showing placeholder (legend is still interactive)
	const isInteractive = totalPeers > 0

	// Get the display value and label for the center text
	const centerValue = activeIndex !== null ? (chartData[activeIndex]?.total ?? 0) : totalPeers
	const centerLabel =
		activeIndex !== null ? chartConfig[chartData[activeIndex]?.network as keyof typeof chartConfig]?.label : 'Peers'

	/* helper for glow on legend items */
	const glowStyle = (color: string) => ({
		filter: `drop-shadow(0 0 4px ${color})`,
	})

	return (
		<Card className='flex flex-col bg-transparent border-none p-0'>
			<CardHeader className='md:items-center md:justify-center p-0 -mb-4 md:mb-0'>
				<CardTitle className='font-outfit text-[16px] font-[500] bg-[linear-gradient(180deg,#ffffff_0%,rgba(255,255,255,0.64)_100%)] bg-clip-text text-transparent'>
					Connections
				</CardTitle>
			</CardHeader>

			<CardContent className='flex flex-1 flex-row-reverse md:flex-col items-center pb-0 gap-8 p-0'>
				<ChartContainer config={chartConfig} className='w-[150px] h-[150px] md:mt-[-10px] mt-[-30px]'>
					{/* TODO: figure out simple way to add a box shadow to the outer edge of each slice */}
					{/* TODO: await isLoading false before animating the chart in */}
					<PieChart>
						<Pie
							data={displayData}
							dataKey='total'
							nameKey='network'
							innerRadius={48}
							outerRadius={65}
							paddingAngle={2.5} // gap between slices
							cornerRadius={3} // rounded slice ends
							strokeWidth={0} // no extra ring
							activeIndex={isInteractive ? (activeIndex ?? undefined) : undefined}
							activeShape={isInteractive ? renderActiveSlice : undefined}
							onMouseEnter={isInteractive ? (_, idx) => setActiveIndex(idx) : undefined}
							onMouseLeave={isInteractive ? () => setActiveIndex(null) : undefined}
						>
							{displayData.map((d) => (
								<Cell key={d.network} fill={d.color} />
							))}
							<Label
								content={({viewBox}) =>
									viewBox &&
									'cx' in viewBox &&
									'cy' in viewBox &&
									typeof viewBox.cx === 'number' &&
									typeof viewBox.cy === 'number' ? (
										<g>
											<text
												x={viewBox.cx}
												y={viewBox.cy}
												textAnchor='middle'
												dominantBaseline='middle'
												className='font-outfit fill-white text-[16px] font-[400]'
											>
												{centerValue.toLocaleString()}
											</text>
											{centerLabel && (
												<text
													x={viewBox.cx}
													y={viewBox.cy + 16}
													textAnchor='middle'
													dominantBaseline='middle'
													className='font-outfit fill-white text-[10px] font-[400] opacity-80'
												>
													{centerLabel}
												</text>
											)}
										</g>
									) : null
								}
							/>
						</Pie>
					</PieChart>
				</ChartContainer>

				{/* Default Legend is too cumbersome to customize, so we're using a custom legend */}
				{/* TODO: go through and clean this tailwind */}
				<ul className='flex flex-col items-center gap-2 text-[12px]'>
					{chartData.map((data, index) => {
						const config = chartConfig[data.network as keyof typeof chartConfig]
						const hovered = index === activeIndex
						return (
							<li
								key={data.network}
								onMouseEnter={() => setActiveIndex(index)}
								onMouseLeave={() => setActiveIndex(null)}
								className='flex w-full max-w-[10rem] justify-between items-center gap-4 cursor-pointer select-none'
								style={hovered ? glowStyle(config.color) : undefined}
							>
								<span className='flex items-center gap-1'>
									<span className='h-3 w-3 rounded-sm border border-white/20' style={{background: config.color}} />
									<span className='capitalize text-white/60'>{config.label}</span>
								</span>
								<span className='text-white/40'>{data.total}</span>
							</li>
						)
					})}
				</ul>
			</CardContent>
		</Card>
	)
}
