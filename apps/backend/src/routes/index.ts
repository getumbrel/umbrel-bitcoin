import fp from 'fastify-plugin'
import type {FastifyInstance} from 'fastify'

import bitcoindRoutes from './bitcoind.js'
import homeRoutes from './home.js'
import wsBlocksRoute from './ws-blocks.js'

// Fastify lets you bundle routes as “plugins”. By registering each feature
// plugin below, server.ts needs to call `app.register(routes)` only once.
export default fp(async (app: FastifyInstance) => {
	await app.register(bitcoindRoutes)
	await app.register(homeRoutes)
	await app.register(wsBlocksRoute)
})
