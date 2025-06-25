import type {SyncStatus} from '#types'

// bitcoind's `verificationprogress` from the getblockchaininfo RPC can't reach 1 when the most recent block is in the past,
// so it will never be 1 in practice.
// To ensure accurate percentage display during sync:
// - When no headers have been downloaded, we set the progress to 0% (verificationprogress = 1 when no headers have been downloaded).
// - When current block matches header count (indicating sync completion), we set the progress to 100%.
// - For other cases, we use the value of `verificationprogress` with 2 decimal places and floor it such that the value is in the range 0% to 99.99%
//   so we don't show 100% until the sync is actually complete.
export function calcSyncPercent(syncStatus?: SyncStatus): number {
	if (!syncStatus) return 0

	// syncProgress is the value of `verificationprogress` from the getblockchaininfo RPC
	const {blockHeight, validatedHeaderHeight, syncProgress} = syncStatus

	// If no headers yet, we show 0%
	if (validatedHeaderHeight === 0) return 0

	// If we're synced to the tip, we show 100%
	if (blockHeight === validatedHeaderHeight) return 100

	// Otherwise use bitcoind's verificationprogress, rounded to 2 decimals
	// We floor it to ensure we don't show 100% until we're actually at the tip
	return Math.floor(syncProgress * 10000) / 100
}

export type SyncStage =
	| 'pre-headers' // pre-synchronizing blockheaders
	| 'headers' // synchronizing blockheaders
	| 'IBD' // initial block download
	| 'synced' // may not be 100% but we're out of IBD

export function syncStage(syncStatus?: SyncStatus): SyncStage {
	if (!syncStatus) return 'pre-headers'

	const {blockHeight, validatedHeaderHeight, isInitialBlockDownload} = syncStatus

	// If validatedHeaderHeight is 0, bitcoind is "Pre-synchronizing blockheaders"
	// If bitcoin restarts during the next phase (sychronizing blockheaders), it will need to pre-sync headers again, but
	// validatedHeaderHeight will be > 0 from last run, so we will just show synchronizing headers stage in UI.
	if (validatedHeaderHeight === 0) return 'pre-headers'

	// If validatedHeaderHeight > 0 and blockHeight is 0, bitcoind is "Synchronizing blockheaders"
	if (validatedHeaderHeight > 0 && blockHeight === 0) return 'headers'

	// If bitcoind is still showing IBD, we show IBD stage
	if (isInitialBlockDownload) return 'IBD'

	// Otherwise we are synced and out of IBD
	return 'synced'
}
