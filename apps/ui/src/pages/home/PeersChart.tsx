import {Cell, Label, Pie, PieChart} from 'recharts'

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {ChartContainer} from '@/components/ui/chart'
import type {ChartConfig} from '@/components/ui/chart'

import {usePeerSummary} from '@/hooks/usePeers'

const chartConfig = {
	clearnet: {label: 'Clearnet', color: 'hsl(29 100% 51%)'},
	tor: {label: 'Tor', color: 'hsl(29 100% 30%)'},
	i2p: {label: 'I2P', color: 'hsl(29 100% 15%)'},
} satisfies ChartConfig

export default function PeersChart() {
	const {data, isLoading} = usePeerSummary()

	const sum = (b?: {inbound: number; outbound: number}) => (b ? b.inbound + b.outbound : 0)

	const torTotal = sum(data?.byNetwork['onion'])
	const i2pTotal = sum(data?.byNetwork['i2p'])

	// we count everything else as clearnet (ipv4, ipv6, cjdns, not_publicly_routable)
	const clearnetTotal = Object.entries(data?.byNetwork ?? {}).reduce(
		(acc, [key, bucket]) => (key === 'onion' || key === 'i2p' ? acc : acc + sum(bucket)),
		0,
	)

	const chartData: {network: string; total: number; color: string}[] = [
		{network: 'clearnet', total: clearnetTotal, color: chartConfig.clearnet.color},
		{network: 'tor', total: torTotal, color: chartConfig.tor.color},
		{network: 'i2p', total: i2pTotal, color: chartConfig.i2p.color},
	]

	const totalPeers = data?.total ?? 0

	// TODO: make responsive
	// TODO: show skeleton while isLoading?
	return (
		<Card className='flex flex-col bg-transparent border-none p-0'>
			<CardHeader className='md:items-center md:justify-center p-0 -mb-4 md:mb-0'>
				<CardTitle className='font-outfit text-[16px] font-[500] bg-[linear-gradient(180deg,#ffffff_0%,rgba(255,255,255,0.64)_100%)] bg-clip-text text-transparent'>
					Peers
				</CardTitle>
			</CardHeader>
			<CardContent className='flex flex-1 flex-row-reverse md:flex-col items-center pb-0 gap-8 p-0 border-none'>
				<ChartContainer config={chartConfig} className='w-[130px] h-[130px] mt-[-10px]'>
					{/* TODO: figure out simple way to add a box shadow to the outer edge of each slice */}
					<PieChart>
						<Pie
							data={chartData}
							dataKey='total'
							nameKey='network'
							innerRadius={48}
							outerRadius={65} // explicit outer radius for clarity
							strokeWidth={0} // no extra ring
							paddingAngle={2.5} // gap between slices
							cornerRadius={3} // rounded slice ends
						>
							{chartData.map((d) => (
								<Cell key={d.network} fill={d.color} />
							))}
							<Label
								content={({viewBox}) => {
									if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
										return (
											<text x={viewBox.cx} y={viewBox.cy} textAnchor='middle' dominantBaseline='middle'>
												<tspan x={viewBox.cx} y={viewBox.cy} className='font-outfit fill-white text-[16px] font-[400]'>
													{totalPeers.toLocaleString()}
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
				<ul className='flexnneex-col items-center gap-2 text-[12px]'>
					{chartData.map((d) => {
						const cfg = chartConfig[d.network as keyof typeof chartConfig]
						return (
							<li key={d.network} className='flex w-full max-w-[10rem] justify-between items-center gap-4'>
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
