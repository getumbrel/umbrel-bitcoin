import {BitcoindManager} from './manager.js'
import {ensureConfig} from '../config/config.js'

// Single bitcoind manager instance that is used throughout the backend
export const bitcoind = new BitcoindManager()

// Boot up bitcoind
export async function bootBitcoind(): Promise<void> {
	// Ensure that the bitcoind configuration files are written and up-to-date before starting bitcoind
	await ensureConfig()

	bitcoind.start()
}
