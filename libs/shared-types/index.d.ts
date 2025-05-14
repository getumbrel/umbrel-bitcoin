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
