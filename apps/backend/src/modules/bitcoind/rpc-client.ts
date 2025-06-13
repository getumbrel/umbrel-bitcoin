import Client from 'bitcoin-core'

export const rpcClient = new Client({
	host: `http://127.0.0.1:${process.env['RPC_PORT'] || '8332'}`,
	username: process.env['RPC_USER'] || 'umbrel',
	password: process.env['RPC_PASS'] || 'moneyprintergobrrr',
})
