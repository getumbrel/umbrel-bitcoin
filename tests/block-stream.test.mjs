import assert from 'node:assert/strict'
import {setImmediate as flush} from 'node:timers/promises'
import {test} from 'node:test'
import {QueryClient, QueryObserver} from '@tanstack/react-query'

import {blockStreamHandlers} from '../apps/ui/src/lib/block-stream.ts'

const block = (height) => ({height, hash: `block-${height}`})
const event = (height) => ({data: JSON.stringify(block(height))})

function fixture(t) {
	const qc = new QueryClient({defaultOptions: {queries: {retry: false, gcTime: Infinity, staleTime: Infinity}}})
	t.after(() => qc.clear())
	return {qc, handlers: blockStreamHandlers(qc)}
}

function watch(t, qc, key, queryFn, initialData) {
	const observer = new QueryObserver(qc, {queryKey: key, queryFn, initialData})
	const stop = observer.subscribe(() => {})
	t.after(stop)
	return observer
}

test('connection restores missed blocks for every active cache and marks inactive caches stale', async (t) => {
	const {qc, handlers} = fixture(t)
	const home = ['rpc', 'blocks', 5]
	const insights = ['rpc', 'blocks', 200]
	const inactive = ['rpc', 'blocks', 100]
	watch(t, qc, home, async () => [block(2), block(3)], [block(0), block(1)])
	watch(t, qc, insights, async () => [block(0), block(1), block(2), block(3)], [block(0), block(1)])
	qc.setQueryData(inactive, [block(0), block(1)])
	handlers.onOpen()
	await flush()
	assert.deepEqual(qc.getQueryData(home), [block(2), block(3)])
	assert.equal(qc.getQueryData(insights).at(-1).height, 3)
	assert.equal(qc.getQueryState(inactive).isInvalidated, true)
})

test('live blocks retain ordering, cache size and duplicate suppression', (t) => {
	const {qc, handlers} = fixture(t)
	const key = ['rpc', 'blocks', 5]
	qc.setQueryData(key, [block(1), block(2), block(3)])
	handlers.onMessage(event(4))
	handlers.onMessage(event(4))
	assert.deepEqual(qc.getQueryData(key), [block(2), block(3), block(4)])
	handlers.onMessage({data: 'invalid json'})
	assert.deepEqual(qc.getQueryData(key), [block(2), block(3), block(4)])
})

for (const initialData of [undefined, [block(0), block(1)]]) {
	test(`a live block during ${initialData ? 'catch-up' : 'initial load'} cannot be overwritten by an older response`, async (t) => {
		const {qc, handlers} = fixture(t)
		const key = ['rpc', 'blocks', 5]
		const responses = []
		watch(t, qc, key, () => new Promise((resolve) => responses.push(resolve)), initialData)
		handlers.onOpen()
		await flush()
		assert.equal(responses.length, 1)
		handlers.onMessage(event(3))
		await flush()
		assert.equal(responses.length, 2)
		responses[1]([block(1), block(2), block(3)])
		await flush()
		responses[0]([block(0), block(1), block(2)])
		await flush()
		assert.deepEqual(qc.getQueryData(key), [block(1), block(2), block(3)])
	})
}
