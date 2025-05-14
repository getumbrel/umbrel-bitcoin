export function ws(path: string) {
	const proto = location.protocol === 'https:' ? 'wss' : 'ws'
	return new WebSocket(`${proto}://${location.host}/api/ws${path}`)
}
