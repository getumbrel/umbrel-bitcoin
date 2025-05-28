// This is a temporary component for playing around.
// TODO: delete this once we have a proper blocks page

import {GradientBorderFromTop} from '@/components/shared/GradientBorders'
import {useBlocks} from '@/hooks/useBlocks'
import prettyBytes from 'pretty-bytes'
import prettyMs from 'pretty-ms'

// “1.3 MB”  → fallback “—” if bytes is undefined
const safePrettyBytes = (bytes?: number) => (typeof bytes === 'number' ? prettyBytes(bytes) : '—')

// “7s ago”, “3m ago”, “2h ago” → fallback “—” if ts is undefined
const safePrettyMsAgo = (ts?: number) => {
	if (typeof ts !== 'number') return '—'
	const diffMs = Date.now() - ts * 1000 // backend sends seconds
	return `${prettyMs(diffMs, {compact: true, unitCount: 1})} ago`
}

export default function TempBlocksComponent() {
	const {data: blocks = []} = useBlocks()

	return (
		<div className='w-full h-full flex space-x-2'>
			{[...Array(5)].map((_, i) => {
				const block = blocks[i]
				return (
					<div
						key={i}
						className='w-[150px] h-[150px] bg-card-gradient border-[0.5px]
                       border-white/6 backdrop-blur-xl rounded-[2px]
                       flex flex-col justify-end p-2'
					>
						<GradientBorderFromTop />
						{/* height */}
						<p className='font-outfit text-[16px] font-[400] text-white'>{block?.height?.toLocaleString() ?? '—'}</p>

						{/* size */}
						<p className='text-white/60 text-[12px] font-[400]'>
							{safePrettyBytes(block?.size)} • {safePrettyMsAgo(block?.time)}
						</p>
					</div>
				)
			})}
		</div>
	)
}
