import {Bar, BarChart, CartesianGrid, XAxis, YAxis} from 'recharts'

import {CardContent, CardFooter, CardHeader, CardTitle} from '@/components/ui/card'
import {ChartContainer, ChartTooltip, ChartTooltipContent} from '@/components/ui/chart'
import InsightCard from './InsightsCard'

import type {ChartConfig} from '@/components/ui/chart'

const chartData = [
	{block: '1', subsidy: 3.125, fees: 0.02},
	{block: '2', subsidy: 3.125, fees: 0.025},
	{block: '3', subsidy: 3.125, fees: 0.05},
	{block: '4', subsidy: 3.125, fees: 0.023},
	{block: '5', subsidy: 3.125, fees: 0.129},
	{block: '6', subsidy: 3.125, fees: 0.08},
	{block: '7', subsidy: 3.125, fees: 0.02},
	{block: '8', subsidy: 3.125, fees: 0.025},
	{block: '9', subsidy: 3.125, fees: 0.05},
	{block: '10', subsidy: 3.125, fees: 0.023},
	{block: '11', subsidy: 3.125, fees: 0.129},
	{block: '12', subsidy: 3.125, fees: 0.08},
	{block: '13', subsidy: 3.125, fees: 0.02},
	{block: '14', subsidy: 3.125, fees: 0.025},
	{block: '15', subsidy: 3.125, fees: 0.05},
	{block: '16', subsidy: 3.125, fees: 0.023},
	{block: '17', subsidy: 3.125, fees: 0.129},
	{block: '18', subsidy: 3.125, fees: 0.08},
	{block: '19', subsidy: 3.125, fees: 0.02},
	{block: '20', subsidy: 3.125, fees: 0.025},
	{block: '21', subsidy: 3.125, fees: 0.05},
	{block: '22', subsidy: 3.125, fees: 0.023},
	{block: '23', subsidy: 3.125, fees: 0.129},
	{block: '24', subsidy: 3.125, fees: 0.08},
]

const chartConfig = {
	subsidy: {
		label: 'Subsidy',
		color: '#FF7E05',
	},
	fees: {
		label: 'Fees',
		color: 'hsla(29, 100%, 51%, 0.44)',
	},
} satisfies ChartConfig

export default function RewardsChart() {
	return (
		<InsightCard>
			<CardHeader>
				<div className='flex justify-between items-center'>
					<CardTitle className='font-outfit text-white text-[20px] font-[400] pt-2'>Block Rewards</CardTitle>
					{/* <CardDescription>Last 2016 Blocks</CardDescription> */}
					{/* Legend */}
					<div className='flex items-center gap-4 text-white/60 text-[12px]'>
						<div className='flex items-center gap-2'>
							<div className='h-2 w-2 rounded-[2px] bg-[#FF7E05]' />
							<span>Subsidy</span>
						</div>
						<div className='flex items-center gap-2'>
							<div className='h-2 w-2 rounded-[2px] bg-[hsla(29,100%,51%,0.44)]' />
							<span>Fees</span>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<BarChart accessibilityLayer data={chartData} margin={{top: 0, right: 0, bottom: 30, left: 0}}>
						<defs>
							<linearGradient id='subsidyGradient' x1='0' y1='0' x2='0' y2='1'>
								<stop offset='0%' stopColor='rgba(255,126,5,0.44)' />
								<stop offset='86.44%' stopColor='rgba(255,126,5,0)' />
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} stroke='hsla(0, 0%, 48%, 0.3)' strokeWidth={0.5} strokeDasharray='4 4' />
						<XAxis
							dataKey='block'
							tickLine={false}
							tickMargin={5}
							axisLine={false}
							tickFormatter={(value) => value.slice(0, 3)}
							label={{value: 'Block', position: 'bottom', offset: 0}}
						/>
						<YAxis
							tickLine={false}
							tickMargin={0}
							axisLine={false}
							tickFormatter={(value) => value.toFixed(1)}
							className='text-white/60 text-[12px]'
							label={{
								value: 'bitcoin',
								angle: -90,
								position: 'insideLeft',
								offset: 20,
								className: 'text-white/60 text-[12px]',
							}}
						/>
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									className='bg-black/90 border-white/10 text-white [&_span]:text-white/60'
									formatter={(value, name) => {
										const color = name === 'subsidy' ? '#FF7E05' : 'hsla(29, 100%, 51%, 0.44)'
										return (
											<div className='flex items-center gap-2'>
												<div className='h-2 w-2 rounded-[2px]' style={{backgroundColor: color}} />
												<span className='text-white/60'>{name === 'subsidy' ? 'Subsidy' : 'Fees'}</span>
												<span className='text-white font-mono font-medium tabular-nums ml-auto'>
													{value.toLocaleString()}
												</span>
											</div>
										)
									}}
								/>
							}
						/>
						{/* <ChartLegend  content={<ChartLegendContent />} /> */}
						<Bar
							dataKey='subsidy'
							stackId='a'
							fill='url(#subsidyGradient)'
							radius={[0, 0, 4, 4]}
							animationDuration={400}
							animationBegin={0}
							animationEasing='ease-out'
						/>
						<Bar
							dataKey='fees'
							stackId='a'
							fill='var(--color-subsidy)'
							radius={[4, 4, 0, 0]}
							animationDuration={400}
							animationBegin={400}
							animationEasing='ease-out'
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
			<CardFooter></CardFooter>
		</InsightCard>
	)
}
