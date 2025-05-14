import fp from 'fastify-plugin'
import type {FastifyInstance} from 'fastify'

import {rpcClient} from '../services/rpc-client.js'
import type {SummaryResponse} from '@umbrel-bitcoin/shared-types'

// TODO: this is just a temporary placeholder
export default fp(async (f: FastifyInstance) => {
	// `f` is the Fastify instance injected by fastify-plugin
	f.get('/api/bitcoind/summary', async (): Promise<SummaryResponse> => {
		const batch = [
			{method: 'getnetworkinfo', parameters: []},
			{method: 'getblockchaininfo', parameters: []},
			{method: 'getpeerinfo', parameters: []},
		]

		const [networkInfo, blockchainInfo, peerInfo] = await rpcClient.command(batch)

		return {networkInfo, blockchainInfo, peerInfo}
	})
})
