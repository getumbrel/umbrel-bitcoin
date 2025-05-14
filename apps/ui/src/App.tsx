// Just a POC playground for now.

import {useEffect, useState} from 'react'
import {useQuery} from '@tanstack/react-query'

import {api} from './lib/api'
import {ws} from './lib/ws'

const useVersion = () =>
	useQuery({
		queryKey: ['version'],
		queryFn: () => api('/bitcoind/version'),
		refetchInterval: 5_000,
	})

const useStatus = () =>
	useQuery({
		queryKey: ['status'],
		queryFn: () => api('/bitcoind/status'),
		refetchInterval: 5_000,
	})

const useSync = () =>
	useQuery({
		queryKey: ['sync'],
		queryFn: () => api('/home/sync'),
		refetchInterval: 5_000,
	})

const usePeers = () =>
	useQuery({
		queryKey: ['peers'],
		queryFn: () => api('/home/peers'),
		refetchInterval: 5_000,
	})

const useBlocks = () =>
	useQuery({
		queryKey: ['blocks'],
		queryFn: () => api('/home/blocks?limit=10'),
	})

type Block = {hash: string; height: number; txs: number; time: number}
type BlocksData = {blocks: Block[]}

export default function App() {
	const {data: version} = useVersion()
	const {data: status} = useStatus()
	const {data: sync} = useSync()
	const {data: peers} = usePeers()
	const {data} = useBlocks()

	const [blocks, setBlocks] = useState<Block[]>([])

	useEffect(() => {
		if (data && Array.isArray((data as BlocksData).blocks)) {
			setBlocks((data as BlocksData).blocks)
		}
	}, [data])

	useEffect(() => {
		const socket = ws('/blocks')
		socket.onmessage = (e) => {
			const b: Block = JSON.parse(e.data)
			setBlocks((prev) => [b, ...prev.slice(0, 9)])
		}
		return () => socket.close()
	}, [])

	return (
		<div style={{lineHeight: 1.3, padding: 16}}>
			<h1>Bitcoin Node</h1>

			<h2>Version</h2>
			<pre>{JSON.stringify(version, null, 2)}</pre>

			<h2>Status</h2>
			<pre>{JSON.stringify(status, null, 2)}</pre>

			<h2>Sync progress</h2>
			<pre>{JSON.stringify(sync, null, 2)}</pre>

			<h2>Peers</h2>
			<pre>{JSON.stringify(peers, null, 2)}</pre>

			<h2>Latest blocks</h2>
			<table style={{borderCollapse: 'collapse', width: '100%'}}>
				<thead>
					<tr>
						<th style={{textAlign: 'left', padding: '8px'}}>Height</th>
						<th style={{padding: '8px'}}>Txs</th>
						<th style={{padding: '8px'}}>Time</th>
						<th style={{textAlign: 'left', padding: '8px'}}>Hash</th>
					</tr>
				</thead>
				<tbody>
					{blocks.map((b) => (
						<tr key={b.hash}>
							<td style={{padding: '8px'}}>{b.height}</td>
							<td style={{padding: '8px'}}>{b.txs}</td>
							<td style={{padding: '8px'}}>{b.time}</td>
							<td style={{padding: '8px'}}>{b.hash.slice(0, 16)}…</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
