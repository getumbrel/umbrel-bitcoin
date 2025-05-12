export async function api<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`/api${path}`, init)
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
	return res.json() as Promise<T>
}
