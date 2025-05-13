import {useQuery} from '@tanstack/react-query'

import type {SummaryResponse, StatusResponse} from '@umbrel-bitcoin/shared-types'

import {api} from './lib/api'

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

	return (
		<>
			<h1>Bitcoin Node</h1>

			{/* bitcoind-manager status */}
			{status && <pre style={{whiteSpace: 'pre-wrap', marginBottom: '1rem'}}>{JSON.stringify(status, null, 2)}</pre>}

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
