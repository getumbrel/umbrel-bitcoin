import {Info as InfoIcon} from 'lucide-react'
import prettyBytes from 'pretty-bytes'
import prettyMs from 'pretty-ms'

import InsightCard from './InsightsCard'
import InfoDialog from '@/components/shared/InfoDialog'
import {useStats} from '@/hooks/useStats'

function prettyBytesSplit(bytes = 0) {
	const [num, unit] = prettyBytes(bytes, {space: true}).split(' ')
	return {num, unit}
}

function Stat({
	label,
	value,
	unit,
	description,
}: {
	label: string
	value: React.ReactNode
	unit?: string
	description?: string
}) {
	return (
		<div className='flex flex-col items-center justify-center gap-2 py-6'>
			<h3 className='flex items-center gap-1 font-outfit text-[15px] font-[300] text-white/30'>
				{label}
				<InfoDialog
					trigger={<InfoIcon className='w-3 h-3 text-white/30 hover:text-white/60 transition-colors' />}
					title={label}
					description={description || ''}
				/>
			</h3>

			<p className='font-outfit text-[20px] font-[500] leading-none'>
				<span className='bg-text-gradient bg-clip-text text-transparent'>{value}</span>
				{unit && <span className='ml-1 text-[13px] font-[300] text-white/50'>{unit}</span>}
			</p>
		</div>
	)
}

export default function StatSummary() {
	const {data} = useStats()

	const peers = data?.peers ?? 0
	const {num: memVal, unit: memUnit} = prettyBytesSplit(data?.mempoolBytes)
	const {num: chainVal, unit: chainUnit} = prettyBytesSplit(data?.chainBytes)
	const uptimeStr = data && data.uptimeSec > 0 ? prettyMs(data.uptimeSec * 1000, {verbose: true, unitCount: 1}) : '—'

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
				<Stat
					label='Connections'
					value={peers}
					unit='Peers'
					description={`These are the total number of peers that you are connected to. By default, your node will only make outgoing connections* unless you enable incoming connections from the Settings page.

											Outbound:
											Your node keeps up to 10 outbound peers (8 full-relay + 2 block-relay-only); a brief +1 “feeler” connection may appear occasionally while the node tests new addresses.

											Inbound:
											If you enable inbound connections, your node can accept up to 115 inbound peers by default (the 125 maxconnections default minus the 10 reserved outbound slots).

											* Wallets, Electrum servers (e.g., Electrs), or other local apps that you point at this node will still show up as inbound connections even when general inbound is disabled.`}
				/>
				<Stat
					label='Mempool'
					value={memVal}
					unit={memUnit}
					description={`This is the RAM your node's mempool is currently using to store unconfirmed transactions that it knows about. The number is unique to *your* node (every node sees a different set of pending transactions) and is limited by the “maxmempool” option in the Settings page.`}
				/>
				<Stat
					label='Blockchain Size'
					value={chainVal}
					unit={chainUnit}
					description={`This is the space used by the block data and the undo information that lets your node rewind blocks if needed. It grows with every new block unless pruning is enabled from the Settings page. The number excludes the UTXO database, index files, wallets, and logs.

											• Full node: shows the entire size of the blockchain.

											• Pruned node: stays near your prune-target size because older blocks are deleted.`}
				/>
				<Stat
					label='Node Uptime'
					value={uptimeStr}
					description='The amount of time that your node has been running since last restart.'
				/>
			</div>
		</InsightCard>
	)
}
