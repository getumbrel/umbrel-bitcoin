import {useEffect} from 'react'
import {useQueryClient} from '@tanstack/react-query'

import {subscribeWebSocket} from '../lib/websocket.js'
import {useSyncStatus} from './useSyncStatus'
import {syncStage} from '@/lib/sync-progress'

import {blockStreamHandlers} from '../lib/block-stream.js'

// Single global WebSocket for real-time block updates.
// Call once in the app shell (Layout). On new block, updates every
// ['rpc', 'blocks', *] query cache so all consumers (home page cubes,
// insights charts) stay in sync without their own WebSocket connections.

export function useBlockStream() {
	const qc = useQueryClient()
	const {data: syncStatus, isError} = useSyncStatus()
	const stage = syncStage(syncStatus)

	useEffect(() => {
		// A restarted backend can accept sockets before Core's RPC is ready.
		// Reconnect and catch up when the polled RPC query recovers.
		if (stage !== 'synced' || isError) return

		return subscribeWebSocket('blocks', blockStreamHandlers(qc))
	}, [stage, isError, qc])
}
