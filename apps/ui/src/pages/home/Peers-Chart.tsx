import {Label, Pie, PieChart} from 'recharts'

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {ChartContainer} from '@/components/ui/chart'
import type {ChartConfig} from '@/components/ui/chart'

// TODO: replace this dummy data with proper query
const chartData = [
	{network: 'clearnet', total: 5},
	{network: 'tor', total: 4},
	{network: 'i2p', total: 2},
] as const

const chartConfig = {
	clearnet: {label: 'Clearnet', color: 'hsl(29 100% 51%)'},
	tor: {label: 'Tor', color: 'hsl(29 100% 30%)'},
	i2p: {label: 'I2P', color: 'hsl(29 100% 15%)'},
} satisfies ChartConfig

export default function PeersChart() {
	// TODO: replace this dummy data with proper query
	const totalVisitors = 11

	// TODO: make responsive
	return (
		<Card className='flex flex-col bg-transparent border-none p-0'>
			<CardHeader className='md:items-center md:justify-center p-0 -mb-4 md:mb-0'>
				<CardTitle
					className=' text-[16px] font-[500] bg-[linear-gradient(180deg,#ffffff_0%,rgba(255,255,255,0.64)_100%)] bg-clip-text text-transparent'
					style={{fontFamily: 'Outfit Variable'}}
				>
					Peers
				</CardTitle>
			</CardHeader>
			<CardContent className='flex flex-1 flex-row-reverse md:flex-col items-center pb-0 gap-8 p-0 border-none'>
				<ChartContainer config={chartConfig} className='w-[130px] h-[130px] mt-[-10px]'>
					{/* TODO: figure out simple way to add a box shadow to the outer edge of each slice */}
					<PieChart>
						{/* Uncomment and modify if we want to show a tooltip */}
						{/* <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} /> */}
						<Pie
							data={chartData.map((d) => ({
								...d,
								fill: chartConfig[d.network].color,
							}))}
							dataKey='total'
							nameKey='network'
							innerRadius={48}
							outerRadius={65} // explicit outer radius for clarity
							strokeWidth={0} // no extra ring
							paddingAngle={2.5} // gap between slices
							cornerRadius={3} // rounded slice ends
						>
							<Label
								content={({viewBox}) => {
									if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
										return (
											<text x={viewBox.cx} y={viewBox.cy} textAnchor='middle' dominantBaseline='middle'>
												<tspan
													x={viewBox.cx}
													y={viewBox.cy}
													className='fill-white text-[16px] font-[400]'
													style={{fontFamily: 'Outfit Variable'}}
												>
													{totalVisitors.toLocaleString()}
												</tspan>
											</text>
										)
									}
								}}
							/>
						</Pie>
					</PieChart>
				</ChartContainer>
				{/* Default Legend is too cumbersome to customize, so we're using a custom legend */}
				{/* TODO: go through and clean this tailwind */}
				<ul className='flex flex-col items-center gap-2 text-sm'>
					{chartData.map((d) => {
						const cfg = chartConfig[d.network]
						return (
							<li key={d.network} className='flex w-full max-w-[10rem] justify-between items-center gap-4 text-xs'>
								<span className='flex items-center gap-1'>
									<span className='h-3 w-3 rounded-sm border border-white/20' style={{background: cfg.color}} />
									<span className='capitalize text-white/60'>{cfg.label}</span>
								</span>

								<span className='text-white/40'>{d.total}</span>
							</li>
						)
					})}
				</ul>
			</CardContent>
		</Card>
	)
}
