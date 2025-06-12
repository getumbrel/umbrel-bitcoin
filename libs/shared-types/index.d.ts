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

export type ExitInfo = {
	code: number | null
	sig: NodeJS.Signals | null
	logTail: string[]
	message: string
}

export type PeerCount = {
	total: number
	byNetwork: Record<string, {inbound: number; outbound: number; total: number}>
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

export type PeerLocation = {
	addr: string
	network: string
	location: [number, number]
}

// subset of getblock (verbosity 1) that we care about
export type RawBlock = {
	hash: string
	height: number
	time: number
	nTx: number
	size: number
	weight: number
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

export type BlockReward = {
	height: number
	subsidySat: number
	feesSat: number
	time: number
}

export type BlockSizeSample = {
	height: number
	sizeBytes: number
	time: number
}

export type FeeRatePoint = {
	height: number
	p10: number // 10th-percentile
	p50: number // 50th-percentile
	p90: number // 90th-percentile
	time: number
}

export type Stats = {
	peers: number // total connections
	mempoolBytes: number // Total memory usage for the mempool in bytes
	chainBytes: number // the estimated size of the block and undo files on disk in bytes
	uptimeSec: number // seconds since bitcoind started (0 if down)
}
