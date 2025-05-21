// Shared type declarations from the backend and ui

export type BitcoindVersion = {
	implementation: string
	version: string
}

export type BitcoindStatus = {
	running: boolean
	startedAt: number | null
	error: Error | null
	// TODO: we probably don't want to pid to the UI, but nice to have in dev right now
	pid: number | null
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

export type PeerSummary = {
	total: number
	byNetwork: Record<string, PeerDirectionCount>
}

// Partial type of getpeerinfo
export type PeerInfo = {
	id: number
	addr: string
	network: string
	relaytxes: boolean
	lastsend: number
	lastrecv: number
	bytessent: number
	bytesrecv: number
	conntime: number
	pingtime: number
	pingwait: number
	version: number
	subver: string
	inbound: boolean
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

export type SyncStatus = {
	syncProgress: number
	isInitialBlockDownload: boolean
	blockHeight: number
	validatedHeaderHeight: number
}
