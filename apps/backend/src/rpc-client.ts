import Client from 'bitcoin-core'

// TODO later: bring these in as env vars
// We hardcode the rpcport to 8332 for all networkds
const RPC_HOST = 'http://127.0.0.1:8332'
const RPC_USER = 'bitcoin'
const RPC_PASS = 'secret'

// cache the rpc client for reuse
let cached: Client | null = null

// Return a memoised bitcoin-core RPC client so that subsequent calls reuse the same instance.
export function getRpc(): Client {
	if (!cached) {
		cached = new Client({
			host: RPC_HOST,
			username: RPC_USER,
			password: RPC_PASS,
		})
	}
	return cached
}
