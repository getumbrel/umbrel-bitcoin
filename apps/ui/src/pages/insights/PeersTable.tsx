// TODO: Organize and clean up this file
import {useMemo, useState} from 'react'

import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type SortingState,
	type ColumnFiltersState,
} from '@tanstack/react-table'
import {ChevronUp, ChevronDown, MoreHorizontal} from 'lucide-react'

import {Button} from '@/components/ui/button'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Input} from '@/components/ui/input'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import InsightCard from './InsightsCard'
import {CardContent, CardHeader} from '@/components/ui/card'
import {CardTitle} from '@/components/ui/card'
import {usePeerInfo} from '@/hooks/usePeers'
import {timeAgoShort} from '@/lib/time-ago-short'

import CheckmarkIcon from '@/assets/checkmark.svg?react'
import FadeScrollArea from '@/components/shared/FadeScrollArea'

function truncateMiddle(str: string, keep = 10) {
	if (str.length <= keep * 2 + 1) return str
	return `${str.slice(0, keep)}…${str.slice(-keep)}`
}

type PeerRow = {
	id: string
	info: {
		subversion: string
		address: string
	}
	network: 'clearnet' | 'tor' | 'i2p' | 'not_publicly_routable' | 'cjdns'
	relayTxns: boolean
	inbound: boolean
	connectionTime: number
}

export const columns: ColumnDef<PeerRow>[] = [
	{
		// subversion & address
		accessorKey: 'info',
		header: () => {
			const {data: peers} = usePeerInfo()
			return (
				<div>
					Peers
					<sup className='ml-1 text-[9px]'>{peers?.length || 0}</sup>
				</div>
			)
		},
		cell: ({row}) => {
			const info = row.getValue('info') as {subversion: string; address: string}
			return (
				<div className='flex flex-col'>
					<div>{info.subversion}</div>
					<div className='text-[11px] text-muted-foreground'>{truncateMiddle(info.address)}</div>
				</div>
			)
		},
	},
	{
		// network
		accessorKey: 'network',
		header: ({column}) => {
			return (
				<div
					className='text-[#757575] text-[13px] font-[400] cursor-pointer hover:text-white flex items-center gap-2'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Network
					{/* Make all other columns sortable */}
					{column.getIsSorted() === 'asc' ? (
						<ChevronUp className='h-4 w-4' />
					) : column.getIsSorted() === 'desc' ? (
						<ChevronDown className='h-4 w-4' />
					) : (
						<ChevronUp className='h-4 w-4' />
					)}
				</div>
			)
		},
		cell: ({row}) => <div className='capitalize'>{row.getValue('network')}</div>,
	},
	{
		// whether we relay txns
		accessorKey: 'relayTxns',
		header: () => <div>Relay TXNs</div>,
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
		// inbound
		accessorKey: 'inbound',
		header: () => <div>In/Out</div>,
		cell: ({row}) => <div className='capitalize'>{row.getValue('inbound') ? 'inbound' : 'outbound'}</div>,
	},
	{
		// connection time
		accessorKey: 'connectionTime',
		header: () => <div>Connected</div>,
		// format as a time since connected from UNIX time
		cell: ({row}) => {
			const unix = row.getValue<number>('connectionTime') // seconds since epoch
			return <div>{timeAgoShort(unix)}</div>
		},
	},

	{
		id: 'actions',
		enableHiding: false,
		cell: ({row}) => {
			const peer = row.original

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant='ghost' className='h-8 w-8 p-0 hover:bg-transparent cursor-pointer group'>
							<span className='sr-only'>Open menu</span>
							<MoreHorizontal className='text-[#757575] group-hover:text-white' />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end' className='bg-black border border-[#252525] text-white'>
						<DropdownMenuItem onClick={() => console.log(`show more details for ${peer.info.address}`)}>
							More details
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => console.log(`block peer ${peer.info.address}`)}>
							Block peer
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)
		},
	},
]

export default function PeersTable() {
	const [sorting, setSorting] = useState<SortingState>([])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [rowSelection, setRowSelection] = useState({})
	const [globalFilter, setGlobalFilter] = useState('')

	const {data: peers, isLoading} = usePeerInfo()

	/* convert Core objects to the row shape the table expects */
	const rows: PeerRow[] = useMemo(() => {
		if (!peers) return []

		return peers.map((p) => ({
			id: String(p.id),
			info: {
				subversion: p.subver?.replace(/\//g, '') || 'Unknown',
				address: p.addr,
			},
			network: p.network === 'onion' ? 'tor' : p.network === 'i2p' ? 'i2p' : 'clearnet',
			relayTxns: p.relaytxes ?? true,
			inbound: p.inbound,
			connectionTime: p.conntime,
		}))
	}, [peers])

	const table = useReactTable({
		data: rows,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: (row, columnId, filterValue) => {
			const searchValue = filterValue.toLowerCase()
			const peer = row.original

			// Search through all relevant fields
			return (
				peer.info.subversion.toLowerCase().includes(searchValue) ||
				peer.info.address.toLowerCase().includes(searchValue) ||
				peer.network.toLowerCase().includes(searchValue) ||
				(peer.relayTxns ? 'relay' : '').includes(searchValue) ||
				(peer.inbound ? 'inbound' : 'outbound').includes(searchValue) ||
				timeAgoShort(peer.connectionTime).includes(searchValue)
			)
		},
		state: {
			sorting,
			columnFilters,
			rowSelection,
			globalFilter,
		},
	})

	// TODO: allow filtering
	// TODO: allow sorting
	// TODO: allow blocking?
	// TODO: responsiveness
	// TODO: choose min content height so filtering doesn't shrink content
	// TODO: sticky header
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
									<TableRow>
										<TableCell colSpan={columns.length} className='h-24 text-center'>
											No results.
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
