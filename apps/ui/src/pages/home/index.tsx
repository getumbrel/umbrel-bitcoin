import {formatDistanceToNowStrict} from 'date-fns'
import {motion, AnimatePresence} from 'framer-motion'
import {Info as InfoIcon} from 'lucide-react'

import {Card, CardContent} from '@/components/ui/card'
import {GradientBorderTopBottom, GradientBorderFromCorners} from '@/components/shared/GradientBorders'
import InfoDialog from '@/components/shared/InfoDialog'
import Globe from './Globe'
import PeersChart from './PeersChart'
import StatusDot from './StatusDot'
import Blocks from './Blocks'

import {useBitcoindStatus} from '@/hooks/useBitcoind'
import {useSyncStatus} from '@/hooks/useSyncStatus'
import {calcSyncPercent, syncStage} from '@/lib/sync-progress'

export default function HomePage() {
	const {data: status, isError, isLoading: isStatusLoading} = useBitcoindStatus()
	const {data: syncStatus, isLoading} = useSyncStatus()

	const running = !isError && status?.running === true
	const uptime = running && status?.startedAt ? formatDistanceToNowStrict(status.startedAt, {addSuffix: false}) : null

	const percentSynced = calcSyncPercent(syncStatus)
	const stage = syncStage(syncStatus)

	let syncSubtitle: React.ReactNode | null = null
	let dialogContent: {title: string; description: string} | null = null

	// Good explanations from Peter Wuille on sync stages:
	// - https://bitcoin.stackexchange.com/questions/121292/how-does-block-synchronization-work-in-bitcoin-core-today
	// - https://bitcoin.stackexchange.com/questions/76018/how-does-headers-first-prevent-disk-fill-attack/121235#121235
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
			dialogContent = {
				title: 'Pre-synchronizing Blockheaders',
				description:
					'Your node is undergoing the first stage of headers synchronization. It is downloading and verifying a complete list of blockheaders to be sure the chain that it will download is legitimate. These are being stored in memory only at this stage.',
			}
			break
		case 'headers':
			syncSubtitle = `${syncStatus?.blockHeight} of ${syncStatus?.validatedHeaderHeight} blocks`
			dialogContent = {
				title: 'Synchronizing Blockheaders',
				description:
					'Your node undergoing the last stage of headers synchronization. It is re-downloading and verifying all blockheaders that it now knows are, in fact, part of the chain with the most work.',
			}
			break
		default:
			syncSubtitle = `${syncStatus?.blockHeight} of ${syncStatus?.validatedHeaderHeight} blocks`
			dialogContent = {
				title: 'Synchronizing Blocks',
				description:
					'Your node is downloading blocks from connected peers, and fully verifying each one (e.g., checking consensus rules, script validity, subsidy, double-spends, etc). The sync percentage reflects how much total chain work has been verified, not the percentage of blocks that have been verified.',
			}
			break
	}

	return (
		<>
			<Card className='bg-card-gradient backdrop-blur-2xl border-none mb-5 pt-4 pb-0 md:pb-4 rounded-3xl'>
				<GradientBorderTopBottom depth='7%' />
				<CardContent className='flex flex-col md:flex-row px-4 items-center'>
					{/* Peers Globe + statuses */}
					<div className='relative w-full flex-none md:flex-1 h-64 md:h-[375px] rounded-2xl bg-neutral-900/20 border-white/10 border-[0.5px] overflow-hidden'>
						<div className='absolute top-[-50%] left-[-40%] w-[500%] h-[500%] rounded-full bg-black pointer-events-none' />
						<GradientBorderFromCorners />

						<div className='md:w-full md:h-full relative md:right-[30%] md:top-[-70%] sm:right-[30%] sm:top-[-90%] right-[80%] top-[-90%]'>
							<Globe />
						</div>

						{/* Running status */}
						<AnimatePresence mode='wait'>
							{/* Only show status when we have data (not loading) */}
							{!isStatusLoading && (
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
											<span className='text-[#0BC39E] text-[14px] font-[500] ml-1'>Running</span>
											{uptime && <span className='text-white/60 text-[14px] font-[400]'>since {uptime}</span>}
										</>
									) : (
										<span className='text-[#EF4444] text-[14px] font-[500] ml-1'>Not running</span>
									)}
								</motion.h3>
							)}
						</AnimatePresence>

						<InfoDialog
							trigger={
								<InfoIcon className='w-4 h-4 text-white/50 hover:text-white/80 transition-colors absolute top-3 right-3' />
							}
							title='Your place in the network'
							description={`The white marker shows your node's location. Each orange marker represents a node you're connected to (peer), and the light trails represent the transactions being relayed to your node in real time.`}
						/>

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
									{syncSubtitle && percentSynced < 100 ? (
										<div className='text-[14px] text-white/50 flex items-center gap-1'>
											<span>{syncSubtitle}</span>
											{dialogContent && (
												<InfoDialog
													trigger={<InfoIcon className='w-3 h-3 text-white/50 hover:text-white/80 transition-colors' />}
													title={dialogContent.title}
													description={dialogContent.description}
												/>
											)}
										</div>
									) : (
										<div className='text-[14px] text-white/50 flex items-center gap-1'>
											<span>Blockchain</span>
										</div>
									)}
									<span className='bg-text-gradient bg-clip-text text-transparent font-[500]'>
										{percentSynced === 100 ? 'Synchronized' : 'Synchronizing'}&nbsp;
									</span>
									<span className='text-white/60'>{percentSynced}%</span>
								</motion.h2>
							)}
						</AnimatePresence>
					</div>

					{/* Peers chart- to the right on desktop and below on mobile */}
					<div className='w-full md:w-[215px] flex flex-col items-center mt-4 md:mt-0 pb-7 md:pb-0'>
						<PeersChart />
					</div>
				</CardContent>
			</Card>

			{/* Blocks page — hidden on mobile */}
			<div className='hidden md:block w-full mt-4'>
				<span className='text-white/50 text-[14px] font-[400] ml-4'>Latest Blocks</span>
				<Blocks />
			</div>
		</>
	)
}
