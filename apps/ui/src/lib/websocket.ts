type Handlers = {
	onOpen?: () => void
	onMessage: (event: MessageEvent) => void
}

// Each subscription owns its socket, token request and retry timers. Fetch a
// fresh token for every attempt: the backend replaces it when it restarts.
export function subscribeWebSocket(path: string, {onOpen, onMessage}: Handlers): () => void {
	let stopped = false
	let retry = 0
	let socket: WebSocket | undefined
	let request: AbortController | undefined
	let retryTimer: ReturnType<typeof setTimeout> | undefined
	let timeout: ReturnType<typeof setTimeout> | undefined

	const closeSocket = () => {
		clearTimeout(timeout)
		if (!socket) return
		socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null
		socket.close()
		socket = undefined
	}

	const scheduleRetry = () => {
		if (stopped || retryTimer !== undefined) return
		closeSocket()
		const delay = 1_000 * 2 ** retry
		retry = Math.min(retry + 1, 5)
		retryTimer = setTimeout(() => {
			retryTimer = undefined
			void connect()
		}, delay)
	}

	const connect = async () => {
		request = new AbortController()
		timeout = setTimeout(() => request?.abort(), 10_000)
		try {
			const response = await fetch('/api/ws/token', {signal: request.signal, cache: 'no-store'})
			if (!response.ok) throw new Error('Cannot fetch WebSocket token')
			const {token} = (await response.json()) as {token: string}
			if (typeof token !== 'string' || !token) throw new Error('Missing WebSocket token')
			if (stopped) return
			clearTimeout(timeout)
			request = undefined

			socket = new WebSocket(
				`${location.origin.replace(/^http/, 'ws')}/api/ws/${path}?token=${encodeURIComponent(token)}`,
			)
			// A stalled handshake must not prevent all subsequent attempts.
			timeout = setTimeout(scheduleRetry, 10_000)
			socket.onopen = () => {
				clearTimeout(timeout)
				retry = 0
				onOpen?.()
			}
			socket.onmessage = onMessage
			socket.onerror = scheduleRetry
			socket.onclose = scheduleRetry
		} catch {
			scheduleRetry()
		}
	}

	void connect()
	return () => {
		stopped = true
		clearTimeout(retryTimer)
		request?.abort()
		closeSocket()
	}
}
