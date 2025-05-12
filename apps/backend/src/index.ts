// NOTE: We can't use elysia with node since it doesn't have websocket support yet and it has some other buggy issues with node.
import Fastify from 'fastify'

const app = Fastify({logger: true})

app.get('/api/hello', () => ({message: 'Hello from the Bitcoin Node backend'}))

app
	.listen({port: 3000, host: '0.0.0.0'})
	.then((address) => console.log(`₿itcoin Node backend is running at ${address}`))
	.catch((error) => {
		app.log.error(`Failed to start server: ${error}`)
		process.exit(1)
	})

process.on('unhandledRejection', (reason) => {
	app.log.error({reason}, 'Unhandled Promise rejection')
})
