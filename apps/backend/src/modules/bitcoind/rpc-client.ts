import Client from 'bitcoin-core'

// TODO later: bring these in as env vars
// We hardcode the rpcport to 8332 for all networkds
const RPC_HOST = 'http://127.0.0.1:8332'
const RPC_USER = 'bitcoin'
const RPC_PASS = 'secret'

export const rpcClient = new Client({
	host: RPC_HOST,
	username: RPC_USER,
	password: RPC_PASS,
})
