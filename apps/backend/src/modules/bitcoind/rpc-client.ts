const url = `http://${process.env['BITCOIND_IP'] || '127.0.0.1'}:${process.env['RPC_PORT'] || '8332'}/`
const auth = `Basic ${Buffer.from(
	`${process.env['RPC_USER'] || 'umbrel'}:${process.env['RPC_PASS'] || 'moneyprintergobrrr'}`,
).toString('base64')}`

let nextId = 0

export const rpcClient = {
	async command<T = unknown>(method: string, ...params: unknown[]): Promise<T> {
		const res = await fetch(url, {
			method: 'POST',
			headers: {'Content-Type': 'application/json', Authorization: auth},
			body: JSON.stringify({method, params, id: nextId++}),
			signal: AbortSignal.timeout(30_000),
		})

		// Auth failures return non-JSON (text/html 401). Consume body to free connection.
		if (!res.ok && !res.headers.get('content-type')?.includes('application/json')) {
			const text = await res.text()
			throw new Error(`RPC ${method}: HTTP ${res.status} ${text}`.trim())
		}

		// V1_LEGACY: RPC errors return non-200 but still have a JSON body, so we
		// intentionally don't gate on res.ok here — just parse and check error.
		let json: {result: T; error: {code: number; message: string} | null}
		try {
			json = await res.json()
		} catch {
			throw new Error(`RPC ${method}: invalid JSON response (HTTP ${res.status})`)
		}

		if (json.error) {
			throw new Error(`RPC ${method}: ${json.error.message} (code ${json.error.code})`)
		}

		return json.result
	},
}
