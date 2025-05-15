import type WebSocket from 'ws'
import type {BlocksResponse, RawBlock, BlockSummary} from '@umbrel-bitcoin/shared-types'

import {rpcClient} from '../bitcoind/rpc-client.js'
import {blockStream} from './zmq-subscriber.js'

export async function syncStatus() {
	const info = await rpcClient.command('getblockchaininfo')
	return {
		syncProgress: info.verificationprogress,
		isInitialBlockDownload: info.initialblockdownload,
		blockHeight: info.blocks,
		validatedHeaderHeight: info.headers,
	}
}

// Get the latest N block summaries
export async function list(limit?: string): Promise<BlocksResponse> {
	// default to 20 blocks
	const numRequested = Number(limit ?? 20)
	// clamp to 1 … 100 for sanity
	const numToReturn = Math.min(Math.max(numRequested, 1), 100)

	// get the current tip height to use as the starting point
	const tipHeight = await rpcClient.command<number>('getblockcount')

	// fetch hashes then summaries in batch RPC style
	const hashes: string[] = await rpcClient.command(
		Array.from({length: numToReturn}, (_, i) => ({
			method: 'getblockhash',
			parameters: [tipHeight - i],
		})),
	)

	// get each block's summary
	// verbosity 1 doesn't include full transaction info, just the txids
	const raw: RawBlock[] = await rpcClient.command(hashes.map((h) => ({method: 'getblock', parameters: [h, 1]})))

	const blocks: BlockSummary[] = raw.map((b) => ({
		hash: b.hash,
		height: b.height,
		time: b.time,
		txs: b.nTx,
		size: b.size,
	}))

	return {blocks}
}

// Attach a websocket and stream new block summaries
export function wsStream(socket: WebSocket) {
	const send = (b: unknown) => socket.send(JSON.stringify(b))
	blockStream.on('block', send)
	socket.on('close', () => blockStream.off('block', send))
}
