const API_PREFIX = '/api'

type ApiOpts = {method?: string; body?: unknown}

export async function api<T>(path: string, opts: ApiOpts = {}): Promise<T> {
	const {method = 'GET', body} = opts

	try {
		const response = await fetch(`${API_PREFIX}${path}`, {
			method,
			headers: {'Content-Type': 'application/json'},
			body: body === undefined ? undefined : JSON.stringify(body),
		})

		// http-status errors
		if (!response.ok) {
			let msg = response.statusText
			try {
				const raw = await response.text()
				const data = JSON.parse(raw)
				msg = data.error ?? data.message ?? raw
			} catch {
				// body wasn’t JSON – keep statusText
			}
			throw new Error(msg)
		}

		// success
		if (response.status === 204) return undefined as T
		return response.json() as Promise<T>
	} catch (error) {
		// network / CORS / DNS failure
		if (error instanceof TypeError) {
			throw new Error('Cannot reach the server. Check your connection and try again.', {cause: error})
		}
		throw error
	}
}
