// Shared type declarations from the backend and ui

export type BitcoindVersion = {
	implementation: string
	version: string
}

export type BitcoindStatus = {
	running: boolean
	// TODO: we probably don't want to pid to the UI, but nice to have in dev right now
	pid: number | null
	error: Error | null
}

type BitcoindLifecyclerResult = 'started' | 'stopped' | 'no_op'

export type BitcoindLifecycleResponse = {
	running: boolean
	pid: number | null
	result: BitcoindLifecycleResult
}

type PeerDirectionCount = {
	inbound: number
	outbound: number
}

export type PeerTally = {
	total: number
	byNetwork: Record<string, PeerDirectionCount>
}

// subset of getblock (verbosity 1) that we care about
export type RawBlock = {
	hash: string
	height: number
	time: number
	nTx: number
	size: number
}

export type BlockSummary = {
	hash: string
	height: number
	time: number
	txs: number
	size: number
}

export type BlocksResponse = {
	blocks: BlockSummary[]
}

// TODO: Replace these 2 below with actual types
export type SummaryResponse = {
	networkInfo: unknown
	blockchainInfo: unknown
	peerInfo: unknown
}

export type StatusResponse = {
	running: boolean
	pid: number
}
