import Client from 'bitcoin-core'

// We hardcode the rpcport to 8332 for all networks
const RPC_HOST = process.env['RPC_HOST'] || 'http://127.0.0.1:8332'
const RPC_USER = process.env['RPC_USER'] || 'bitcoin'
const RPC_PASS = process.env['RPC_PASS'] || 'supersecretpassword'

export const rpcClient = new Client({
	host: RPC_HOST,
	username: RPC_USER,
	password: RPC_PASS,
})
