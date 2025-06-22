import {useEffect, useState} from 'react'

export function useTransactionSocket(): number {
	const [tick, setTick] = useState(0) // monotonically increasing

	useEffect(() => {
		const ws = new WebSocket(`${location.origin.replace(/^http/, 'ws')}/api/ws/transactions`)

		ws.onmessage = () => setTick((t) => t + 1) // no batching loss
		ws.onerror = console.error
		return () => ws.close()
	}, [])

	return tick
}
