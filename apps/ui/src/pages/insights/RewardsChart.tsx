// import { TrendingUp } from "lucide-react"
import {Bar, BarChart, CartesianGrid, XAxis} from 'recharts'

import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card'
import {ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent} from '@/components/ui/chart'

import type {ChartConfig} from '@/components/ui/chart'
import {GradientBorderFromTop} from '@/components/shared/GradientBorders'

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
		<Card className='bg-gradient-to-b from-[#0F0F0FD9] to-[#080808] backdrop-blur-2xl border-none mb-6 py-4 rounded-3xl'>
			<GradientBorderFromTop />
			<CardHeader>
				<div className='flex justify-between items-center'>
					<CardTitle className='text-white text-[20px] font-[400]' style={{fontFamily: 'Outfit Variable'}}>
						Block Rewards
					</CardTitle>
					{/* <CardDescription>Last 2016 Blocks</CardDescription> */}
					{/* custom legend */}
					<div className='text-white/60'>I am a legend</div>
				</div>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<BarChart accessibilityLayer data={chartData}>
						<defs>
							{/* rgba(255, 126, 5, 0.44) → rgba(255, 126, 5, 0) from top to 86.44% down */}
							<linearGradient id='subsidyGradient' x1='0' y1='0' x2='0' y2='1'>
								<stop offset='0%' stopColor='rgba(255,126,5,0.44)' />
								<stop offset='86.44%' stopColor='rgba(255,126,5,0)' />
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} stroke='hsla(0, 0%, 48%, 0.15)' strokeWidth={0.5} strokeDasharray='4 4' />
						<XAxis
							dataKey='block'
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							tickFormatter={(value) => value.slice(0, 3)}
						/>
						<ChartTooltip content={<ChartTooltipContent hideLabel />} />
						{/* <ChartLegend  content={<ChartLegendContent />} /> */}
						<Bar dataKey='subsidy' stackId='a' fill='url(#subsidyGradient)' radius={[0, 0, 4, 4]} />
						<Bar dataKey='fees' stackId='a' fill='var(--color-subsidy)' radius={[4, 4, 0, 0]} />
					</BarChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className='flex-col items-start gap-2 text-sm'>
				{/* <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this block <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 blocks
        </div> */}
			</CardFooter>
		</Card>
	)
}
