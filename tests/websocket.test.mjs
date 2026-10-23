import assert from 'node:assert/strict'
import {setImmediate as flush} from 'node:timers/promises'
import {test} from 'node:test'

import {subscribeWebSocket} from '../apps/ui/src/lib/websocket.ts'

function fixture(t) {
	const sockets = []
	const requests = []
	let token = 'first-token'
	let respond = async () => Response.json({token})
	const previousLocation = Object.getOwnPropertyDescriptor(globalThis, 'location')
	const previousWebSocket = Object.getOwnPropertyDescriptor(globalThis, 'WebSocket')
	Object.defineProperty(globalThis, 'location', {configurable: true, value: {origin: 'https://bitcoin.test'}})
	t.after(() => {
		if (previousLocation) Object.defineProperty(globalThis, 'location', previousLocation)
		else delete globalThis.location
		Object.defineProperty(globalThis, 'WebSocket', previousWebSocket)
	})
	t.mock.timers.enable({apis: ['setTimeout']})
	t.mock.method(globalThis, 'fetch', (url, options) => {
		requests.push({url, ...options})
		return respond(url, options)
	})
	Object.defineProperty(globalThis, 'WebSocket', {
		configurable: true,
		value: class {
			onopen = null
			onclose = null
			onerror = null
			onmessage = null
			closed = false
			constructor(url) {
				this.url = url
				sockets.push(this)
			}
			open() {
				this.onopen?.({})
			}
			message(data) {
				this.onmessage?.({data: JSON.stringify(data)})
			}
			drop() {
				this.closed = true
				this.onclose?.({})
			}
			close() {
				this.closed = true
			}
		},
	})
	return {
		sockets,
		requests,
		setToken(value) {
			token = value
		},
		setResponse(fn) {
			respond = fn
		},
		async advance(ms) {
			t.mock.timers.tick(ms)
			await flush()
		},
	}
}

for (const path of ['blocks', 'transactions', 'bitcoind/exit']) {
	test(`${path}: resumes messages once after a dropped connection`, async (t) => {
		const f = fixture(t)
		const messages = []
		let opens = 0
		const stop = subscribeWebSocket(path, {onOpen: () => opens++, onMessage: (e) => messages.push(JSON.parse(e.data))})
		t.after(stop)
		await flush()
		assert.equal(f.sockets[0].url, `wss://bitcoin.test/api/ws/${path}?token=first-token`)
		f.sockets[0].open()
		f.sockets[0].message({sequence: 1})
		f.sockets[0].drop()
		await f.advance(999)
		assert.equal(f.sockets.length, 1)
		await f.advance(1)
		assert.equal(f.requests.length, 2)
		f.sockets[1].open()
		f.sockets[0].message({sequence: 'old connection'})
		f.sockets[1].message({sequence: 2})
		assert.deepEqual(messages, [{sequence: 1}, {sequence: 2}])
		assert.equal(opens, 2)
		assert.equal(f.sockets.filter((s) => !s.closed).length, 1)
	})
}

test('fetches the replacement token after a backend restart', async (t) => {
	const f = fixture(t)
	const stop = subscribeWebSocket('blocks', {onMessage() {}})
	t.after(stop)
	await flush()
	f.sockets[0].open()
	f.setToken('replacement+token&value')
	f.sockets[0].drop()
	await f.advance(1000)
	assert(f.sockets[1].url.endsWith('?token=replacement%2Btoken%26value'))
	assert.equal(f.requests.length, 2)
	assert(f.requests.every((r) => r.url === '/api/ws/token'))
})

test('backs off failed requests up to 32 seconds and resets after a successful connection', async (t) => {
	const f = fixture(t)
	f.setResponse(async () => {
		throw new TypeError('offline')
	})
	const stop = subscribeWebSocket('transactions', {onMessage() {}})
	t.after(stop)
	await flush()
	for (const delay of [1000, 2000, 4000, 8000, 16000, 32000, 32000]) {
		const count = f.requests.length
		await f.advance(delay - 1)
		assert.equal(f.requests.length, count)
		await f.advance(1)
		assert.equal(f.requests.length, count + 1)
	}
	f.setResponse(async () => Response.json({token: 'online'}))
	await f.advance(32000)
	f.sockets[0].open()
	f.sockets[0].drop()
	await f.advance(1000)
	assert.equal(f.sockets.length, 2)
})

test('retries HTTP errors and invalid token responses without opening a socket', async (t) => {
	const f = fixture(t)
	const responses = [
		new Response('', {status: 503}),
		new Response('invalid JSON'),
		Response.json({}),
		Response.json({token: ''}),
		Response.json({token: 'valid'}),
	]
	f.setResponse(async () => responses.shift())
	const stop = subscribeWebSocket('blocks', {onMessage() {}})
	t.after(stop)
	await flush()
	for (const delay of [1000, 2000, 4000]) {
		await f.advance(delay)
		assert.equal(f.sockets.length, 0)
	}
	await f.advance(8000)
	assert.equal(f.sockets.length, 1)
})

test('a rejected handshake retries once even when error and close both fire', async (t) => {
	const f = fixture(t)
	const stop = subscribeWebSocket('bitcoind/exit', {onMessage() {}})
	t.after(stop)
	await flush()
	const close = f.sockets[0].onclose
	f.sockets[0].onerror({})
	close({})
	await f.advance(1000)
	assert.equal(f.sockets.length, 2)
	assert.equal(f.requests.length, 2)
})

test('times out a hanging token request and recovers', async (t) => {
	const f = fixture(t)
	f.setResponse(
		(_url, {signal}) =>
			new Promise((_resolve, reject) => {
				signal.addEventListener('abort', () => reject(signal.reason), {once: true})
			}),
	)
	const stop = subscribeWebSocket('blocks', {onMessage() {}})
	t.after(stop)
	await f.advance(10000)
	assert(f.requests[0].signal.aborted)
	f.setResponse(async () => Response.json({token: 'recovered'}))
	await f.advance(1000)
	assert.equal(f.sockets.length, 1)
})

test('times out a hanging handshake and closes it before retrying', async (t) => {
	const f = fixture(t)
	const stop = subscribeWebSocket('blocks', {onMessage() {}})
	t.after(stop)
	await flush()
	await f.advance(10000)
	assert(f.sockets[0].closed)
	await f.advance(1000)
	assert.equal(f.sockets.length, 2)
	assert.equal(f.sockets.filter((s) => !s.closed).length, 1)
})

test('cleanup cancels a pending retry', async (t) => {
	const f = fixture(t)
	const stop = subscribeWebSocket('blocks', {onMessage() {}})
	await flush()
	f.sockets[0].drop()
	stop()
	await f.advance(60000)
	assert.equal(f.requests.length, 1)
})

test('cleanup aborts a pending request and ignores a late response', async (t) => {
	const f = fixture(t)
	let resolve
	f.setResponse(
		() =>
			new Promise((r) => {
				resolve = r
			}),
	)
	const stop = subscribeWebSocket('blocks', {onMessage() {}})
	stop()
	assert(f.requests[0].signal.aborted)
	resolve(Response.json({token: 'late'}))
	await flush()
	await f.advance(60000)
	assert.equal(f.sockets.length, 0)
	assert.equal(f.requests.length, 1)
})

test('cleanup disconnects an open socket without leaving handlers or retries', async (t) => {
	const f = fixture(t)
	let messages = 0
	const stop = subscribeWebSocket('transactions', {
		onMessage() {
			messages++
		},
	})
	await flush()
	f.sockets[0].open()
	stop()
	f.sockets[0].message({type: 'txPing'})
	f.sockets[0].drop()
	await f.advance(60000)
	assert.equal(messages, 0)
	assert(f.sockets[0].closed)
	assert.equal(f.sockets[0].onopen, null)
	assert.equal(f.sockets[0].onerror, null)
	assert.equal(f.requests.length, 1)
})

test('immediate mount / cleanup / remount leaves only the current subscription', async (t) => {
	const f = fixture(t)
	let oldMessages = 0
	let newMessages = 0
	const stopFirst = subscribeWebSocket('transactions', {
		onMessage() {
			oldMessages++
		},
	})
	stopFirst()
	const stopSecond = subscribeWebSocket('transactions', {
		onMessage() {
			newMessages++
		},
	})
	t.after(stopSecond)
	await flush()
	assert.equal(f.sockets.length, 1)
	f.sockets[0].open()
	f.sockets[0].message({type: 'txPing'})
	assert.equal(oldMessages, 0)
	assert.equal(newMessages, 1)
})
