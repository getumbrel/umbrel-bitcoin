// In-memory TTL cache for bitcoind RPC calls
// Each unique `key` gets its own bucket (e.g., peerinfo, blocks, etc).

// This gives us light protection against accidental or malicious DDoS of bitcoind,
// since we're maxed out at one RPC call every `ttlMs` for each unique `key`.
//
// • A single browser tab can hit several endpoints that call the same
//   Bitcoin Core RPC under the hood (e.g. peers/info, peers/count, peers/locations).
//   Without a server-side cache those endpoints would spam bitcoind in parallel.
//
// • We’re using TanStack Query on the front-end, so each endpoint response
//   is cached in the browser.  However, TanStack’s cache lives only in the
//   tab that created it.  Opening multiple tabs or browsers bypasses that
//   client-side cache and would spam bitcoind unless we also cache on the
//   server.

type Entry<T> = {value: T; expiry: number}
const store = new Map<string, Entry<unknown>>()

export async function cache<T>(key: string, ttlMs: number, fetchNewData: () => Promise<T>): Promise<T> {
	const cached = store.get(key) as Entry<T> | undefined

	// If the cached value is still valid, return it
	if (cached && cached.expiry > Date.now()) return cached.value

	// Otherwise, fetch new data and cache it
	const value = await fetchNewData()
	store.set(key, {value, expiry: Date.now() + ttlMs})
	return value
}
