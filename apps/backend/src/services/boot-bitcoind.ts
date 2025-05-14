import {BitcoindManager} from './bitcoind-manager.js'

// TODO: replace with actual conf logic later
async function writeMockConf(): Promise<void> {
	// Just mock async work for now
	await new Promise((r) => setTimeout(r, 5))
}

// Single bitcoind manager instance that is used throughout the backend
export const bitcoind = new BitcoindManager()

// Boot up bitcoind
export async function bootBitcoind(): Promise<void> {
	await writeMockConf()
	bitcoind.start()
}
