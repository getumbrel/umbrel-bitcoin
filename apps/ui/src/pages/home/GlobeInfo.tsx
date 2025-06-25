import {InfoIcon, XIcon} from 'lucide-react'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'

import {GradientBorderFromTop} from '@/components/shared/GradientBorders'

import UserDotIcon from '@/assets/user-dot.svg?react'
import PeerDotIcon from '@/assets/peer-dot.svg?react'
import TransactionIcon from '@/assets/transaction.svg?react'
import GlobeImage from '@/assets/globe.png'

export default function GlobeInfo() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<InfoIcon className='w-4 h-4 text-white/50 hover:text-white/70 transition-colors' />
			</DialogTrigger>
			<DialogContent
				className='bg-card-gradient backdrop-blur-2xl border-white/10 border-[0.5px] rounded-2xl max-h-[90vh] flex flex-col sm:max-w-[768px] p-0'
				showCloseButton={false}
			>
				<GradientBorderFromTop />
				<DialogClose asChild>
					<button className='absolute top-4 right-4 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10'>
						<XIcon className='w-3 h-3 text-white/70' />
					</button>
				</DialogClose>

				<div className='px-6 pt-6 pb-4 flex flex-col'>
					<DialogHeader>
						<DialogTitle className='font-outfit text-white text-[20px] font-[400] text-left'>
							You're part of something big
						</DialogTitle>
						<DialogDescription className='text-white/60 text-left text-[13px] -mt-1'>
							Here's a brand new way to visualize your place in the network
						</DialogDescription>
					</DialogHeader>

					<div className='divide-y divide-white/6 overflow-hidden rounded-xl w-full h-fit bg-gradient-to-b from-[#1C1C1C] to-[#0D0D0D] mt-4'>
						<Line
							icon={<UserDotIcon className='w-5 h-5 text-white' />}
							title='Your node'
							description='The white dot is your Bitcoin node'
						/>
						<Line
							icon={<PeerDotIcon className='w-5 h-5 text-white' />}
							title='Your peers'
							description="Orange dots are other nodes you're connected to (peers). They are bigger when multiple peers share the same location"
						/>
						<Line
							icon={<TransactionIcon className='w-5 h-5 text-white' />}
							title='Transactions'
							description='The moving dots represent transactions being relayed from other nodes to your node in real-time'
						/>
					</div>
				</div>

				<img src={GlobeImage} alt='Globe' className='w-full flex-1 object-cover rounded-b-2xl' />
			</DialogContent>
		</Dialog>
	)
}

function Line({icon, title, description}: {icon: React.ReactNode; title: string; description: string}) {
	return (
		<div className='flex items-center gap-4 px-4 py-3'>
			<div className='shrink-0'>{icon}</div>
			<div className='flex flex-col'>
				<p className='text-white text-[14px] font-[500]'>{title}</p>
				<p className='text-white/40 text-[12px] font-[400]'>{description}</p>
			</div>
		</div>
	)
}
