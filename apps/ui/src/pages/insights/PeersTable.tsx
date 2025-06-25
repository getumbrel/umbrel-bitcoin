// TODO: Clean up this file
import {useMemo, useState} from 'react'
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type SortingState,
	type Header,
} from '@tanstack/react-table'
import {ChevronUp, ChevronDown} from 'lucide-react'

import {Input} from '@/components/ui/input'
import {CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'

import InsightCard from './InsightsCard'
import {usePeerInfo} from '@/hooks/usePeers'
import {timeAgoShort} from '@/lib/time-ago-short'
import FadeScrollArea from '@/components/shared/FadeScrollArea'
import CheckmarkIcon from '@/assets/checkmark.svg?react'

// function truncateMiddle(str: string, keep = 10) {
// 	if (str.length <= keep * 2 + 1) return str
// 	return `${str.slice(0, keep)}…${str.slice(-keep)}`
// }

type PeerRow = {
	id: string
	info: {
		subversion: string
		address: string
	}
	network: {
		category: string // 'Clearnet' | 'Tor' | 'I2P'
		subcategory: string // the actual network name returned by the RPC
	}
	relayTxns: boolean
	inbound: boolean
	connectionTime: number
}

export const columns: ColumnDef<PeerRow>[] = [
	{
		// subversion & address
		id: 'info',
		accessorFn: (row) => row.info.subversion.toLowerCase(), // scalar for sorting
		header: ({header, table}) => {
			const total = table.getPreFilteredRowModel().rows.length
			return (
				<SortableHeader header={header}>
					<div className=''>
						Peers <sup className='text-[9px]'>{total}</sup>
					</div>
				</SortableHeader>
			)
		},
		cell: ({row}) => {
			const {subversion, address} = row.original.info
			return (
				<div className='flex flex-col'>
					{/* Set a max width and scrollable container for these because they can be very long (e.g., onion addresses) */}
					<FadeScrollArea className='max-w-[14rem]'>{subversion}</FadeScrollArea>
					<FadeScrollArea className='max-w-[10rem] text-[11px] text-muted-foreground'>{address}</FadeScrollArea>
				</div>
			)
		},
	},
	{
		// network
		id: 'network',
		accessorFn: (row) => row.network.category, // scalar for sorting
		header: ({header}) => <SortableHeader header={header}>Network</SortableHeader>,
		cell: ({row}) => {
			const {category} = row.original.network
			return <div className='capitalize'>{category}</div>
		},
	},
	{
		// whether we relay txns
		accessorKey: 'relayTxns',
		header: ({header}) => <SortableHeader header={header}>Relay TXNs</SortableHeader>,
		cell: ({row}) => {
			// checkmark filled if true, otherwise checkmark with opacity 0.5
			return (
				<div>
					{row.getValue('relayTxns') ? (
						<CheckmarkIcon className='h-4 w-4' />
					) : (
						<CheckmarkIcon className='h-4 w-4 opacity-20' />
					)}
				</div>
			)
		},
	},
	{
		// inbound/outbound
		accessorKey: 'inbound',
		header: ({header}) => <SortableHeader header={header}>In/Out</SortableHeader>,
		cell: ({row}) => <div className='capitalize'>{row.getValue('inbound') ? 'inbound' : 'outbound'}</div>,
	},
	{
		// connection time
		accessorKey: 'connectionTime',
		header: ({header}) => <SortableHeader header={header}>Connected</SortableHeader>,
		// format as a time since connected from UNIX time
		cell: ({row}) => {
			const unix = row.getValue<number>('connectionTime') // seconds since epoch
			return <div>{timeAgoShort(unix)}</div>
		},
	},

	// TODO: implement ability to block peers and see additional peer details
	// {
	// 	id: 'actions',
	// 	enableHiding: false,
	// 	cell: ({row}) => {
	// 		const peer = row.original

	// 		return (
	// 			<DropdownMenu>
	// 				<DropdownMenuTrigger asChild>
	// 					<Button variant='ghost' className='h-8 w-8 p-0 hover:bg-transparent cursor-pointer group'>
	// 						<span className='sr-only'>Open menu</span>
	// 						<MoreHorizontal className='text-[#757575] group-hover:text-white' />
	// 					</Button>
	// 				</DropdownMenuTrigger>
	// 				<DropdownMenuContent align='end' className='bg-black border border-[#252525] text-white'>
	// 					<DropdownMenuItem onClick={() => console.log(`show more details for ${peer.info.address}`)}>
	// 						More details
	// 					</DropdownMenuItem>
	// 					<DropdownMenuItem onClick={() => console.log(`block peer ${peer.info.address}`)}>
	// 						Block peer
	// 					</DropdownMenuItem>
	// 				</DropdownMenuContent>
	// 			</DropdownMenu>
	// 		)
	// 	},
	// },
]

function SortableHeader<T>({header, children}: {header: Header<T, unknown>; children: React.ReactNode}) {
	const dir = header.column.getIsSorted() // 'asc' | 'desc' | false
	return (
		<div
			onClick={header.column.getToggleSortingHandler()}
			className='flex items-center gap-2 cursor-pointer text-[#757575] hover:text-white text-[13px] font-[400]'
		>
			{children}
			{dir === 'asc' ? (
				<ChevronUp className='h-4 w-4' />
			) : dir === 'desc' ? (
				<ChevronDown className='h-4 w-4' />
			) : (
				// keeps width stable
				<ChevronUp className='h-4 w-4 opacity-0' />
			)}
		</div>
	)
}

export default function PeersTable() {
	const [sorting, setSorting] = useState<SortingState>([])
	const [rowSelection, setRowSelection] = useState({})
	const [globalFilter, setGlobalFilter] = useState('')

	const {data: peers} = usePeerInfo()

	// Convert data to the row shape the table expects
	const rows: PeerRow[] = useMemo(() => {
		if (!peers) return []

		return peers.map((p) => ({
			id: String(p.id),
			info: {
				subversion: p.subver?.replace(/\//g, '') || 'Unknown',
				address: p.addr,
			},
			network: {
				category:
					p.network === 'onion'
						? 'tor'
						: p.network === 'i2p'
							? 'I2P'
							: // It is very likely that the user will have a local electrum server like electrs connected which will be not_publicly_routable (along with other app connections)
								// We show "local" in this case, because the user may have set up Tor-only for connections and may be confused at an incoming "clearnet" connection
								p.network === 'not_publicly_routable'
								? 'local'
								: 'clearnet',
				subcategory: p.network,
			},
			relayTxns: p.relaytxes ?? true,
			inbound: p.inbound,
			connectionTime: p.conntime,
		}))
	}, [peers])

	const table = useReactTable({
		data: rows,
		columns,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: (row, _columnId, filterValue) => {
			const searchValue = filterValue.toLowerCase()
			const peer = row.original

			// Search through all relevant fields
			return (
				peer.info.subversion.toLowerCase().includes(searchValue) ||
				peer.info.address.toLowerCase().includes(searchValue) ||
				peer.network.category.toLowerCase().includes(searchValue) ||
				(peer.relayTxns ? 'relay' : '').includes(searchValue) ||
				(peer.inbound ? 'inbound' : 'outbound').includes(searchValue) ||
				timeAgoShort(peer.connectionTime).includes(searchValue)
			)
		},
		state: {
			sorting,
			rowSelection,
			globalFilter,
		},
	})

	// TODO: allow filtering
	// TODO: allow sorting
	// TODO: sticky table header while maintaining fade scroll area
	return (
		<InsightCard>
			<CardHeader>
				<CardTitle className='font-outfit text-white text-[20px] font-[400] pt-2'>Peer Connections</CardTitle>
			</CardHeader>
			<CardContent>
				<Input
					placeholder='Filter peers...'
					value={globalFilter ?? ''}
					onChange={(event) => setGlobalFilter(event.target.value)}
					className='max-w-xs mb-4 border-none bg-[#272727] shadow-[inset_0_-1px_1px_0_rgba(255,255,255,0.2),_inset_0_1px_1px_0_rgba(0,0,0,0.36)] text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/10'
				></Input>
				<FadeScrollArea
					className='h-[350px]
             [--fade-top:hsla(0,0%,6%,1)]
             [--fade-bottom:hsla(0,0%,3%,1)]'
				>
					<div className='rounded-md'>
						<Table>
							<TableHeader>
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow
										className='border-b border-[#252525] bg-[#0B0B0B] hover:bg-[#0B0B0B] shadow-[inset_0_4px_4px_0_rgba(0,0,0,0.5)]'
										key={headerGroup.id}
									>
										{headerGroup.headers.map((header) => {
											return (
												<TableHead className='text-[#757575] text-[13px] font-[400]' key={header.id}>
													{header.isPlaceholder
														? null
														: flexRender(header.column.columnDef.header, header.getContext())}
												</TableHead>
											)
										})}
									</TableRow>
								))}
							</TableHeader>
							<TableBody className='text-white text-[14px] font-[400]'>
								{table.getRowModel().rows?.length ? (
									table.getRowModel().rows.map((row) => (
										<TableRow
											className='border-b border-[#252525] hover:bg-transparent'
											key={row.id}
											data-state={row.getIsSelected() && 'selected'}
										>
											{row.getVisibleCells().map((cell) => (
												<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
											))}
										</TableRow>
									))
								) : (
									<TableRow className='hover:bg-transparent'>
										<TableCell
											colSpan={columns.length}
											className='h-24 text-center text-[14px] font-[400] text-white/50'
										>
											No peer connections.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</FadeScrollArea>
			</CardContent>
		</InsightCard>
	)
}
