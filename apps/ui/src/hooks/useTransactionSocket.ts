import {useEffect, useState} from 'react'

export function useTransactionSocket(): number {
	const [txCount, setTxCount] = useState(0)

	useEffect(() => {
		const ws = new WebSocket(`${location.origin.replace(/^http/, 'ws')}/api/ws/transactions`)

		ws.onmessage = (e) => {
			try {
				// The backend sends one “txPing” frame every 33 ms, with
				// `count` = number of transactions in that slice.
				const {type, count = 1} = JSON.parse(e.data)
				if (type === 'txPing') setTxCount((t) => t + count)
			} catch {
				// fallback for unexpected payloads
				setTxCount((t) => t + 1)
			}
		}

		ws.onerror = console.error
		return () => ws.close()
	}, [])

	return txCount
}
