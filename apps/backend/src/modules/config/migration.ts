// This module is responsible for migrating the JSON config from the previous app (umbel-config.json) to this app's equivalent settings.json
import path from 'node:path'
import fse from 'fs-extra'

import {writeWithBackup} from './fs-helpers.js'
import {APP_STATE_DIR} from '../../lib/paths.js'
import {settingsSchema, defaultValues, type SettingsSchema} from '#settings'

const LEGACY_CONFIG_PATH = path.join(APP_STATE_DIR, 'bitcoin-config.json')
const NEW_CONFIG_PATH = path.join(APP_STATE_DIR, 'settings.json')

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
	coinstatsindex: 'coinstatsindex',
	datacarrier: 'datacarrier',
	datacarriersize: 'datacarriersize',
	permitbaremultisig: 'permitbaremultisig',
	rejectparasites: 'rejectparasites',
	rejecttokens: 'rejecttokens',
	minrelaytxfee: 'minrelaytxfee',
	permitbarepubkey: 'permitbarepubkey',
	datacarriercost: 'datacarriercost',
	acceptnonstddatacarrier: 'acceptnonstddatacarrier',
	blockmaxsize: 'blockmaxsize',
	dustrelayfee: 'dustrelayfee',
	blockmaxweight: 'blockmaxweight',
	blockreconstructionextratxn: 'blockreconstructionextratxn',
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

	const legacyConfig = await fse.readJson(LEGACY_CONFIG_PATH)

	// First we translate the config options that are not 1-to-1
	const translated: Partial<SettingsSchema> = {
		// the legacy config split up the outgoing connections into separate keys for clearnet, tor, and i2p
		onlynet: [
			...(legacyConfig.clearnet ? ['clearnet'] : []),
			...(legacyConfig.tor ? ['tor'] : []),
			...(legacyConfig.i2p ? ['i2p'] : []),
		],
		// the legacy config had a single incomingConnections key that was a boolean for whether to allow incoming connections on ALL networks
		listen: legacyConfig.incomingConnections ? ['clearnet', 'tor', 'i2p'] : [],
		// only use the pruneSizeGB value if prune is enabled because pruning could be disabled in the old app even with a pruneSizeGB value set
		prune: legacyConfig.prune?.enabled ? legacyConfig.prune.pruneSizeGB : 0,
	}

	// Then we translate the config options that are 1-to-1
	for (const [legacyKey, modernKey] of Object.entries(LEGACY_TO_MODERN_MAP)) {
		if (legacyKey in legacyConfig) translated[modernKey] = legacyConfig[legacyKey]
	}

	// merge with current defaults and validate to fail fast here if there are any issues
	// This is done again in ensureConfig
	const validated = settingsSchema.parse({...defaultValues, ...translated})

	await writeWithBackup(NEW_CONFIG_PATH, JSON.stringify(validated, null, 2) + '\n')
	await fse.move(LEGACY_CONFIG_PATH, `${LEGACY_CONFIG_PATH}.bak`, {overwrite: false})

	return validated
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
