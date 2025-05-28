import {formatDistanceToNowStrict} from 'date-fns'
import {motion, AnimatePresence} from 'framer-motion'

import {Card, CardContent} from '@/components/ui/card'
import {GradientBorderTopBottom, GradientBorderFromCorners} from '@/components/shared/GradientBorders'
import Globe from './Globe'
import PeersChart from './PeersChart'
import StatusDot from './StatusDot'
import Blocks from './Blocks'

import {useBitcoindStatus} from '@/hooks/useBitcoind'
import {useSyncStatus} from '@/hooks/useSyncStatus'
import {calcSyncPercent, syncStage} from '@/lib/sync-progress'

export default function HomePage() {
	const {data: status, isError} = useBitcoindStatus()
	const {data: syncStatus, isLoading} = useSyncStatus()

	const running = !isError && status?.running === true
	const uptime = running && status?.startedAt ? formatDistanceToNowStrict(status.startedAt, {addSuffix: false}) : null

	const percentSynced = calcSyncPercent(syncStatus)
	const stage = syncStage(syncStatus)

	let syncSubtitle: React.ReactNode | null = null

	switch (stage) {
		case 'pre-headers':
			// TODO: break this out into a component
			syncSubtitle = (
				<span className='relative inline-block select-none'>
					{/* base, readable letters – stay white */}
					<span className=''>Pre-synchronizing blockheaders</span>

					{/* overlay highlight – slides over the same glyphs */}
					<span aria-hidden className='absolute inset-0 animate-shimmer pointer-events-none'>
						Pre-synchronizing blockheaders
					</span>
				</span>
			)
			break
		case 'headers':
			syncSubtitle = `${syncStatus?.blockHeight} of ${syncStatus?.validatedHeaderHeight} blocks`
			break
		default:
			syncSubtitle = `${syncStatus?.blockHeight} of ${syncStatus?.validatedHeaderHeight} blocks`
			break
	}

	return (
		<>
			<Card className='bg-card-gradient backdrop-blur-2xl border-none mb-5 py-4 rounded-3xl'>
				<GradientBorderTopBottom depth='7%' />
				<CardContent className='flex flex-col md:flex-row px-4 items-center'>
					{/* Peers Globe + statuses */}
					<div className='relative w-full flex-none md:flex-1 h-64 md:h-[375px] rounded-2xl bg-neutral-900/20 border-white/10 border-[0.5px] overflow-hidden'>
						<div className='absolute top-[-50%] left-[-40%] w-[500%] h-[500%] rounded-full bg-black pointer-events-none' />
						<GradientBorderFromCorners />

						<Globe />

						{/* Running status */}
						{/* TODO: don't quickly flash not running to running on refresh */}
						<AnimatePresence mode='wait'>
							<motion.h3
								// the key prop tells Motion when state flips
								key={running ? 'running' : 'stopped'}
								initial={{opacity: 0}}
								animate={{opacity: 1}}
								exit={{opacity: 0}}
								transition={{duration: 0.25}}
								className='absolute top-[7%] left-[5%] flex items-center gap-1 justify-center'
							>
								<StatusDot running={running} />

								{running ? (
									<>
										<span className='text-[#0BC39E] text-[14px] font-[500] ml-1'>Running&nbsp;</span>
										{uptime && <span className='text-white/60 text-[14px] font-[400]'>for {uptime}</span>}
									</>
								) : (
									<span className='text-[#EF4444] text-[14px] font-[500] ml-1'>Not running</span>
								)}
							</motion.h3>
						</AnimatePresence>

						{/* Sync status */}
						<AnimatePresence mode='wait'>
							{/* We don't show if not running or isLoading */}
							{running && !isLoading && (
								<motion.h2
									key='sync-banner'
									initial={{opacity: 0}}
									animate={{opacity: 1}}
									exit={{opacity: 0}}
									transition={{duration: 0.25}}
									className='absolute top-[70%] md:top-[80%] left-[5%] text-[30px]'
								>
									<span className='bg-text-gradient bg-clip-text text-transparent font-[500]'>Synchronizing&nbsp;</span>
									<span className='text-white/60'>{percentSynced}%</span>

									{/* We only show the subtitle if the sync is not complete */}
									{syncSubtitle && percentSynced < 100 && (
										<span className='text-[14px] text-white/50 block'>{syncSubtitle}</span>
									)}
								</motion.h2>
							)}
						</AnimatePresence>
					</div>

					{/* Peers chart- to the right on desktop and below on mobile */}
					<div className='w-full md:w-[215px] flex flex-col items-center mt-5 md:mt-0 pb-7 md:pb-0'>
						<PeersChart />
					</div>
				</CardContent>
			</Card>

			{/* Blocks page — hidden on mobile */}
			<div className='hidden md:block w-full'>
				{/* <TempBlocksComponent /> */}
				<Blocks />
			</div>
		</>
	)
}
