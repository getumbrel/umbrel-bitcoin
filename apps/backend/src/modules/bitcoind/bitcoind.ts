import type {BitcoindVersion, BitcoindStatus, BitcoindLifecycleResponse} from '@umbrel-bitcoin/shared-types'

// This is the BitcoindManager instance created in boot.js
import {bitcoind} from './boot.js'

export const version = (): BitcoindVersion => bitcoind.getVersionInfo()

export const status = (): BitcoindStatus => bitcoind.status()

export const start = (): BitcoindLifecycleResponse => {
	if (status().running) return {...status(), result: 'no_op'}
	bitcoind.start()
	return {...status(), result: 'started'}
}

export const stop = async (): Promise<BitcoindLifecycleResponse> => {
	if (!status().running) return {...status(), result: 'no_op'}
	await bitcoind.stop()
	return {...status(), result: 'stopped'}
}

export const restart = async (): Promise<BitcoindLifecycleResponse> => {
	await bitcoind.restart()
	return {...status(), result: 'started'}
}
