const API_PREFIX = '/api'

export async function api<T>(
	path: string,
	// Default to GET if no method is provided
	opts: {method?: string; body?: unknown} = {},
): Promise<T> {
	const {method = 'GET', body} = opts

	const response = await fetch(`${API_PREFIX}${path}`, {
		method,
		headers: {'content-type': 'application/json'},
		body: body === undefined ? undefined : JSON.stringify(body),
	})

	if (!response.ok) throw new Error(await response.text())
	return response.json() as Promise<T>
}
