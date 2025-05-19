import {Card, CardContent} from '@/components/ui/card'
import PeersChart from './PeersChart'
import BlocksPage from './Blocks'
import Globe from './Globe'
import StatusDot from './StatusDot'
import {GradientBorderTopBottom, GradientBorderFromCorners} from '@/components/shared/GradientBorders'

export default function StatusPanel() {
	return (
		<>
			<Card className='bg-gradient-to-b from-[#0F0F0FD9] to-[#080808] backdrop-blur-2xl border-none mb-6 py-4 rounded-3xl'>
				<GradientBorderTopBottom depth='7%' />
				<CardContent className='flex flex-col md:flex-row px-4 items-center'>
					{/* Globe + statuses */}
					<div className='relative w-full flex-none md:flex-1 h-64 md:h-[375px] rounded-2xl bg-neutral-900/20 border-white/10 border-[0.5px] overflow-hidden'>
						<div className='absolute top-[-50%] left-[-40%] w-[500%] h-[500%] rounded-full bg-black pointer-events-none' />
						<GradientBorderFromCorners />

						<Globe />

						<h3 className='text-white/50 absolute top-[7%] left-[5%] flex items-center gap-1 justify-center'>
							<StatusDot />
							<div>
								<span className='text-[#0BC39E] text-[14px] font-[500]'>Running </span>
								<span className='text-white/60 text-[14px] font-[400]'> since 7 days</span>
							</div>
						</h3>

						{/* TODO: add pre-sync + header statuses */}
						<h2 className='absolute top-[80%] left-[5%] text-[30px]'>
							<span className='bg-gradient-to-b from-white to-[rgba(255,255,255,0.64)] bg-clip-text text-transparent font-[500]'>
								Synchronized{' '}
							</span>
							<span className='text-white/60'>100%</span>
						</h2>
					</div>

					{/* right — peers chart */}
					<div className='w-full md:w-[215px] flex flex-col items-center mt-5 md:mt-0 pb-7 md:pb-0'>
						<PeersChart />
					</div>
				</CardContent>
			</Card>

			{/* We hide the blocks page on mobile */}
			<div className='hidden md:block'>
				<BlocksPage />
			</div>
		</>
	)
}
