// This hook sets up a WebSocket connection to the backend to listen for bitcoind exit events
// It also shows a toast notification when bitcoind crashes

import {useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {useQueryClient} from '@tanstack/react-query'
import {toast} from 'sonner'

import {useWebSocketToken} from './useWebSocketToken'

import type {ExitInfo} from '#types'

// Fixed ID for the toast notification so we can make sure not to show it multiple times
const TOAST_ID = 'bitcoind-exit'

export function useBitcoindExitSocket() {
	const qc = useQueryClient()
	const navigate = useNavigate()
	const {data} = useWebSocketToken()

	useEffect(() => {
		if (!data?.token) return
		const ws = new WebSocket(`${location.origin.replace(/^http/, 'ws')}/api/ws/bitcoind/exit?token=${data?.token}`)

		const showToast = () => {
			toast.error('Bitcoin Core stopped unexpectedly', {
				id: TOAST_ID,
				duration: Infinity,
				closeButton: true,
				action: {
					label: 'View logs',
					onClick: () => navigate('/settings?tab=advanced&clearSearch=true'),
				},
			})
		}

		ws.onmessage = (event) => {
			const msg = JSON.parse(event.data)

			// The backend sends a snapshot immediately after the client connects
			// If the snapshot shows that bitcoind is running -> clear state & dismiss toast
			if (msg.type === 'snapshot' && msg.running) {
				qc.setQueryData(['bitcoind', 'exit'], null)
				toast.dismiss(TOAST_ID)
				return
			}

			// If the snapshot shows that bitcoind is not running -> cache the exit info & show toast
			if (msg.type === 'snapshot' && !msg.running && msg.exit) {
				const info = msg.exit as ExitInfo
				qc.setQueryData(['bitcoind', 'exit'], info)
				showToast()
				return
			}

			// If we get a live "exit" event (bitcoind just crashed while the socket is open) -> cache the exit info & show toast
			if (msg.type === 'exit') {
				const info = msg as ExitInfo
				qc.setQueryData(['bitcoind', 'exit'], info)
				showToast()
				return
			}
		}

		return () => ws.close()
	}, [qc, navigate, data?.token])
}
