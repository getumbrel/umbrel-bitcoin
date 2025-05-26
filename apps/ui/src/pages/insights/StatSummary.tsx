// TODO: add info popover
import {Info as InfoIcon} from 'lucide-react'
import prettyBytes from 'pretty-bytes'
import {formatDistanceStrict} from 'date-fns'

import InsightCard from './InsightsCard'
import {useStats} from '@/hooks/useStats'

function prettyBytesSplit(bytes = 0) {
	const [num, unit] = prettyBytes(bytes, {space: true}).split(' ')
	return {num, unit}
}

function Stat({label, value, unit}: {label: string; value: React.ReactNode; unit?: string}) {
	return (
		<div className='flex flex-col items-center justify-center gap-2 py-6'>
			<h3 className='flex items-center gap-1 font-outfit text-[15px] font-[300] text-white/30'>
				{label} <InfoIcon className='w-3 h-3 opacity-60' />
			</h3>

			<p className='font-outfit text-[20px] font-[500] leading-none'>
				<span className='bg-text-gradient bg-clip-text text-transparent'>{value}</span>
				{unit && <span className='ml-1 text-[13px] font-[300] text-white/50'>{unit}</span>}
			</p>
		</div>
	)
}

export default function StatSummary() {
	const {data, isLoading, isError} = useStats()

	const peers = data?.peers ?? 0
	const {num: memVal, unit: memUnit} = prettyBytesSplit(data?.mempoolBytes)
	const {num: chainVal, unit: chainUnit} = prettyBytesSplit(data?.chainBytes)
	const uptimeStr = data && data.uptimeSec > 0 ? formatDistanceStrict(0, data.uptimeSec * 1000, {unit: 'minute'}) : '—'

	return (
		<InsightCard className='p-0 overflow-hidden h-[240px] md:h-[120px]'>
			{/* 2×2 on mobile, 1×4 on md+  */}
			<div
				className='
				h-full grid grid-cols-2 md:grid-cols-4
				[&>*:nth-child(4n+1)]:bg-transparent
			[&>*:nth-child(4n+2)]:bg-white/5
			[&>*:nth-child(4n+3)]:bg-white/5
				[&>*:nth-child(4n+4)]:bg-transparent
				md:[&>*:nth-child(odd)]:bg-transparent
			md:[&>*:nth-child(even)]:bg-white/5
				'
			>
				<Stat label='Connections' value={peers} unit='Peers' />
				<Stat label='Mempool' value={memVal} unit={memUnit} />
				<Stat label='Blockchain Size' value={chainVal} unit={chainUnit} />
				<Stat label='Node Uptime' value={uptimeStr} />
			</div>
		</InsightCard>
	)
}
