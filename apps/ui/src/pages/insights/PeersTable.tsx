import * as React from 'react'
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
import {CardContent, CardFooter, CardHeader} from '@/components/ui/card'
import {CardTitle} from '@/components/ui/card'

const data: PeerData[] = [
	{
		id: 'm5gr84i9',
		info: {
			subversion: 'Bitcoin Core',
			address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa.onion',
		},
		network: 'onion',
		relay_txns: true,
		inbound: false,
		routable: true,
	},
	{
		id: '3u1reuv4',
		info: {
			subversion: 'Bitcoin Core',
			address: '10.21.1.10',
		},
		network: 'clearnet',
		relay_txns: true,
		inbound: false,
		routable: true,
	},
	{
		id: 'derv1ws0',
		info: {
			subversion: 'Bitcoin Core',
			address: '11234asdfgkjh34e36345',
		},
		network: 'i2p',
		relay_txns: false,
		inbound: true,
		routable: true,
	},
	{
		id: '5kma53ae',
		info: {
			subversion: 'Bitcoin Core',
			address: '162.222.178.178',
		},
		network: 'clearnet',
		relay_txns: true,
		inbound: true,
		routable: false,
	},
	{
		id: 'bhqecj4p',
		info: {
			subversion: 'Bitcoin Core',
			address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa.onion',
		},
		network: 'onion',
		relay_txns: true,
		inbound: false,
		routable: true,
	},
]

export type PeerData = {
	id: string
	info: {
		subversion: string
		address: string
	}
	network: string
	relay_txns: boolean
	inbound: boolean
	routable: boolean
}

export const columns: ColumnDef<PeerData>[] = [
	{
		// subversion & address
		accessorKey: 'info',
		header: 'Peers',
		cell: ({row}) => {
			const info = row.getValue('info') as {subversion: string; address: string}
			return (
				<div className='flex flex-col'>
					<div>{info.subversion}</div>
					<div className='text-[11px] text-muted-foreground'>{info.address}</div>
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
		cell: ({row}) => <div className='lowercase'>{row.getValue('network')}</div>,
	},
	{
		// whether we relay txns
		accessorKey: 'relay_txns',
		header: () => <div>Relay TXNs</div>,
		cell: ({row}) => {
			return <div>{row.getValue('relay_txns') ? 'Yes' : 'No'}</div>
		},
	},
	{
		// inbound
		accessorKey: 'inbound',
		header: () => <div>Inbound</div>,
		cell: ({row}) => <div>{row.getValue('inbound') ? 'Yes' : 'No'}</div>,
	},
	{
		// routable
		accessorKey: 'routable',
		header: () => <div>Routable</div>,
		cell: ({row}) => <div>{row.getValue('routable') ? 'Yes' : 'No'}</div>,
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
	const [sorting, setSorting] = React.useState<SortingState>([])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
	const [rowSelection, setRowSelection] = React.useState({})
	const [globalFilter, setGlobalFilter] = React.useState('')

	const table = useReactTable({
		data,
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
				(peer.relay_txns ? 'yes' : 'no').includes(searchValue) ||
				(peer.inbound ? 'yes' : 'no').includes(searchValue) ||
				(peer.routable ? 'yes' : 'no').includes(searchValue)
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
	// TODO: scroll instead of pagination
	// TODO: responsiveness
	// TODO: choose min content height so filtering doesn't shrink content
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
					className='max-w-sm mb-4 bg-[#272727] border border-transparent text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/10'
				/>
				<div className='rounded-md'>
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow className='border-b border-[#252525] hover:bg-transparent' key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead className='text-[#757575] text-[13px] font-[400]' key={header.id}>
												{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
			</CardContent>
			<CardFooter>{/* Should we put anything here? */}</CardFooter>
		</InsightCard>
	)
}
