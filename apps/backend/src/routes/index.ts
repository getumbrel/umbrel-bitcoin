import fp from 'fastify-plugin'
import type {FastifyInstance} from 'fastify'

import bitcoindRoutes from './bitcoind.js'
import summaryRoute from './summary.js'
import wsBlocksRoute from './ws-blocks.js'

// Fastify lets you bundle routes as “plugins”. By registering each feature
// plugin below, server.ts needs to call `app.register(routes)` only once.

export default fp(async (f: FastifyInstance) => {
	// `f` is the Fastify instance injected by fastify-plugin
	await f.register(bitcoindRoutes)
	await f.register(summaryRoute)
	await f.register(wsBlocksRoute)
})
