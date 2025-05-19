import {Card, CardContent} from '@/components/ui/card'

import {GradientBorderFromCorners, GradientBorderFromTop} from '@/components/shared/GradientBorders'
import RewardsChart from './RewardsChart'
import PeersTable from './PeersTable'

export default function StatusPanel() {
	return (
		<>
			<RewardsChart />
			<PeersTable />
			<Card className='bg-gradient-to-b from-[#0F0F0FD9] to-[#080808] backdrop-blur-2xl border-[0.5px] border-white/6 ring-white/6 mb-6 py-4 rounded-3xl h-[400px]'>
				<GradientBorderFromTop />
				<CardContent className='flex flex-col md:flex-row px-4 items-center'>
					<p className='text-white/50 text-[16px] font-[500]'>placeholder</p>
				</CardContent>
			</Card>
			<Card className='bg-gradient-to-b from-[#0F0F0FD9] to-[#080808] backdrop-blur-2xl border-[0.5px] border-white/6 ring-white/6 mb-6 py-4 rounded-3xl h-[400px]'>
				<GradientBorderFromTop />
				<CardContent className='flex flex-col md:flex-row px-4 items-center'>
					<p className='text-white/50 text-[16px] font-[500]'>placeholder</p>
				</CardContent>
			</Card>
		</>
	)
}
