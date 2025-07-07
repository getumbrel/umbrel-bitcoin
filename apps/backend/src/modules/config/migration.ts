// This module is responsible for migrating the JSON config from the previous app (umbel-config.json) to this app's equivalent settings.json
// It will run on first boot after the update and coerce the values to the new schema if needed.
import path from 'node:path'
import fse from 'fs-extra'
import {ZodError} from 'zod'

import {writeWithBackup} from './fs-helpers.js'
import {APP_STATE_DIR} from '../../lib/paths.js'
import {settingsSchema, defaultValues, settingsMetadata, type SettingsSchema, type Option} from '#settings'

const LEGACY_CONFIG_PATH = path.join(APP_STATE_DIR, 'bitcoin-config.json')
const NEW_CONFIG_PATH = path.join(APP_STATE_DIR, 'settings.json')

// Normalise anything “boolean‑like” that may appear in the legacy file.
const toBool = (v: unknown): boolean => {
	if (typeof v === 'boolean') return v
	if (typeof v === 'number') return v === 1
	if (typeof v === 'string') {
		const s = v.trim().toLowerCase()
		if (s === 'true') return true
		if (s === 'false') return false
		if (s === '1') return true
		if (s === '0') return false
	}
	return false
}

// Coerce legacy string / number / boolean mixes into the correct runtime types expected by the new schema, using `settingsMetadata` as the single source of truth.
// Legacy values should already be stored as the correct types; however, this is a defensive measure in case users have manually edited the file or there are edge cases we aren't aware of in the old app.
function coerceFromMetadata(raw: Record<string, unknown>) {
	const out: Record<string, unknown> = {}

	for (const [key, value] of Object.entries(raw)) {
		// ignore any unknown keys
		if (!(key in settingsMetadata)) continue

		const meta = settingsMetadata[key as keyof typeof settingsMetadata] as Option

		switch (meta.kind) {
			case 'number':
				out[key] = typeof value === 'string' ? Number(value) : value
				break
			case 'toggle':
				out[key] = toBool(value)
				break
			default:
				// 'multi' & 'select' need no coercion here
				out[key] = value
		}
	}
	return out
}

// Mapping of legacy config options to modern config options.
// Options with values that are 1-to-1 with the modern config options are included. Options that require logic to translate are handled below.
// These are listed in the same order as the old DEFAULT_ADVANCED_SETTINGS from the legacy app for ease of comparison
const LEGACY_TO_MODERN_MAP: Record<string, keyof SettingsSchema> = {
	// clearnet: mapped to onlynet[]
	torProxyForClearnet: 'proxy',
	// tor: mapped to onlynet[]
	// i2p: mapped to onlynet[]
	// incomingConnections: mapped to listen[]
	peerblockfilters: 'peerblockfilters',
	blockfilterindex: 'blockfilterindex',
	peerbloomfilters: 'peerbloomfilters',
	bantime: 'bantime',
	maxconnections: 'maxconnections',
	maxreceivebuffer: 'maxreceivebuffer',
	maxsendbuffer: 'maxsendbuffer',
	// maxtimeadjustment: no longer in bitcoind -help-debug
	peertimeout: 'peertimeout',
	timeout: 'timeout',
	maxuploadtarget: 'maxuploadtarget',
	cacheSizeMB: 'dbcache',
	// prune: handled above to deconstruct the pruneSizeGB value
	// mempoolFullRbf: no longer in bitcoind -help-debug
	datacarrier: 'datacarrier',
	datacarriersize: 'datacarriersize',
	permitbaremultisig: 'permitbaremultisig',
	maxmempool: 'maxmempool',
	mempoolexpiry: 'mempoolexpiry',
	persistmempool: 'persistmempool',
	maxorphantx: 'maxorphantx',
	// reindex: never actually used in previous app
	rest: 'rest',
	rpcworkqueue: 'rpcworkqueue',
	// network values in legacy app are one-to-one with chain (main, test, testnet4, signet, regtest)
	network: 'chain',
}

export async function migrateLegacyConfig(): Promise<SettingsSchema | undefined> {
	// If the old bitcoin-config.json doesn't exist, we don't need to migrate
	if (!(await fse.pathExists(LEGACY_CONFIG_PATH))) return

	const legacyConfig = await fse.readJson(LEGACY_CONFIG_PATH).catch((err) => {
		// throw a nicely formatted error message that is logged by the Fastify server logger
		const msg =
			err instanceof SyntaxError
				? '[migration] Invalid JSON in legacy bitcoin-config.json'
				: '[migration] Unable to read legacy bitcoin-config.json'
		throw new Error(`${msg}: ${err.message}`)
	})

	// First we translate the config options that are not 1-to-1
	const translated: Partial<SettingsSchema> = {
		// the legacy config split up the outgoing connections into separate keys for clearnet, tor, and i2p
		onlynet: [
			...(toBool(legacyConfig.clearnet) ? ['clearnet'] : []),
			...(toBool(legacyConfig.tor) ? ['tor'] : []),
			...(toBool(legacyConfig.i2p) ? ['i2p'] : []),
		],
		// the legacy config had a single incomingConnections key that was a boolean for whether to allow incoming connections on ALL networks
		listen: toBool(legacyConfig.incomingConnections) ? ['clearnet', 'tor', 'i2p'] : [],
		// only use the pruneSizeGB value if prune is enabled because pruning could be disabled in the old app even with a pruneSizeGB value set
		prune: toBool(legacyConfig.prune?.enabled) ? Number(legacyConfig.prune.pruneSizeGB) : 0,
	}

	// Then we translate the config options that are 1-to-1
	for (const [legacyKey, modernKey] of Object.entries(LEGACY_TO_MODERN_MAP)) {
		if (legacyKey in legacyConfig) translated[modernKey] = legacyConfig[legacyKey]
	}

	// defensively coerce the values to the new schema
	const coerced = coerceFromMetadata(translated)

	try {
		const validated = settingsSchema.parse({...defaultValues, ...coerced})
		await writeWithBackup(NEW_CONFIG_PATH, JSON.stringify(validated, null, 2) + '\n')
		await fse.move(LEGACY_CONFIG_PATH, `${LEGACY_CONFIG_PATH}.bak`, {overwrite: false})
		return validated
	} catch (error) {
		if (error instanceof ZodError) {
			// This should be extremely rare because we defensively coerce the values to the new schema
			// but could still happen if, for example, the user manually edits the chain to an invalid value like "mainnet"
			const summary = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
			throw new Error(`[migration] Validation of legacy config failed – ${summary}`)
		}
		throw new Error('[migration] Unexpected error during migration of legacy config', {cause: error as Error})
	}
}

// Previous app's bitcoin-config.json for reference:

// const DEFAULT_ADVANCED_SETTINGS = {
//   clearnet: true,
//   torProxyForClearnet: false,
//   tor: true,
//   i2p: true,
//   incomingConnections: false,
//   peerblockfilters: true,
//   blockfilterindex: true,
//   peerbloomfilters: false,
//   bantime: 86400,
//   maxconnections: 125,
//   maxreceivebuffer: 5000,
//   maxsendbuffer: 1000,
//   maxtimeadjustment: 4200,
//   peertimeout: 60,
//   timeout: 5000,
//   maxuploadtarget: 0,
//   cacheSizeMB: 450,
//   prune: {
//     enabled: false,
//     pruneSizeGB: 300,
//   },
//   mempoolFullRbf: true,
//   datacarrier: true,
//   datacarriersize: 83,
//   permitbaremultisig: true,
//   maxmempool: 300,
//   mempoolexpiry: 336,
//   persistmempool: true,
//   maxorphantx: 100,
//   reindex: false,
//   rest: false,
//   rpcworkqueue: 128,
//   network: constants.BITCOIN_DEFAULT_NETWORK
// }
