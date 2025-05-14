// TODO: this is just a POC playground for now
import {useState, useEffect} from 'react'
import {useQuery} from '@tanstack/react-query'

import type {SummaryResponse, StatusResponse} from '@umbrel-bitcoin/shared-types'

import {api} from './lib/api'
import {ws} from './lib/ws'

/* summary (batched RPC data) */
const useSummary = () =>
	useQuery<SummaryResponse>({
		queryKey: ['summary'],
		queryFn: () => api('/bitcoind/summary'),
		refetchInterval: 5_000,
	})

// status: app.get('/api/bitcoind/status', () => bitcoind.status())
const useStatus = () =>
	useQuery<StatusResponse>({
		queryKey: ['status'],
		queryFn: () => api('/bitcoind/status'),
		refetchInterval: 5_000,
	})

export default function App() {
	const {data: summary} = useSummary()
	const {data: status} = useStatus()

	const {networkInfo, blockchainInfo, peerInfo} = summary ?? {}

	const [blocks, setBlocks] = useState<{hash: string; height: number; txs: number; time: number}[]>([])

	useEffect(() => {
		const socket = ws('/blocks')
		socket.onmessage = (e) => {
			const b = JSON.parse(e.data)
			setBlocks((prev) => [b, ...prev.slice(0, 4)])
		}
		return () => socket.close()
	}, [])

	return (
		<>
			<h1>Bitcoin Node</h1>

			{/* bitcoind-manager status */}
			{status && <pre style={{whiteSpace: 'pre-wrap', marginBottom: '1rem'}}>{JSON.stringify(status, null, 2)}</pre>}

			{/* live blocks */}
			<h2 style={{marginTop: '2rem'}}>Latest blocks (regtest)</h2>

			<table
				style={{
					borderCollapse: 'collapse',
					width: '100%',
					marginBottom: '1rem',
					fontSize: '0.9rem',
				}}
			>
				<thead>
					<tr>
						{['Height', 'Txs', 'Time', 'Hash'].map((h) => (
							<th
								key={h}
								style={{
									textAlign: 'left',
									padding: '6px 10px',
									borderBottom: '2px solid #ccc',
								}}
							>
								{h}
							</th>
						))}
					</tr>
				</thead>

				<tbody>
					{blocks.map((b) => (
						<tr key={b.hash}>
							<td style={{padding: '6px 10px'}}>{b.height}</td>
							<td style={{padding: '6px 10px'}}>{b.txs}</td>
							<td style={{padding: '6px 10px', whiteSpace: 'nowrap'}}>{b.time}</td>
							<td
								style={{
									padding: '6px 10px',
									fontFamily: 'monospace',
									wordBreak: 'break-all',
								}}
							>
								{b.hash.slice(0, 16)}…
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{/* node summary */}
			<div style={{display: 'flex', gap: '1rem'}}>
				<div style={{flex: 1}}>
					<h2>Network Info</h2>
					<pre style={{flex: 1, whiteSpace: 'pre-wrap'}}>{JSON.stringify(networkInfo, null, 2)}</pre>
				</div>

				<div style={{flex: 1}}>
					<h2>Blockchain Info</h2>
					<pre style={{flex: 1, whiteSpace: 'pre-wrap'}}>{JSON.stringify(blockchainInfo, null, 2)}</pre>
				</div>

				<div style={{flex: 1}}>
					<h2>Peer Info</h2>
					<pre style={{flex: 1, whiteSpace: 'pre-wrap'}}>{JSON.stringify(peerInfo, null, 2)}</pre>
				</div>
			</div>
		</>
	)
}
