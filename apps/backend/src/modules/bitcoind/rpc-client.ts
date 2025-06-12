import Client from 'bitcoin-core'

import {RPC_PORT, RPC_USER, RPC_PASS} from './manager.js'

export const rpcClient = new Client({
	host: `http://127.0.0.1:${RPC_PORT}`,
	username: RPC_USER,
	password: RPC_PASS,
})
