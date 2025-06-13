// TODO: break out some config-helpers into a separate file

import path from 'node:path'
import fse from 'fs-extra'
import {writeWithBackup} from './fs-helpers.js'

import {BITCOIN_DIR, APP_STATE_DIR} from '../../lib/paths.js'
import {restart} from '../bitcoind/bitcoind.js'
import {settingsSchema, defaultValues, type SettingsSchema} from '@umbrel-bitcoin/settings'

// Paths to the config files
const SETTINGS_JSON = path.join(APP_STATE_DIR, 'settings.json')
const UMBREL_CONF = path.join(BITCOIN_DIR, 'umbrel-bitcoin.conf')
const BITCOIN_CONF = path.join(BITCOIN_DIR, 'bitcoin.conf')

const BITCOIN_CONF_BANNER = [
	'# Load additional configuration file, relative to the data directory.',
	`includeconf=${path.basename(UMBREL_CONF)}`,
].join('\n')

// In-memory cache of the current settings
// We update this cache with the latest settings every time we update the settings.json file
let cachedSettings: SettingsSchema | undefined

// Merge user JSON with defaults & validate
// No deep merge is needed here because our settings structure is flat
function mergeWithDefaults(partial: Partial<SettingsSchema>): SettingsSchema {
	return {...defaultValues, ...partial} as SettingsSchema
}

// Apply rules that depend on other settings before we write to disk
function applyDerivedSettings(settings: SettingsSchema): SettingsSchema {
	const newSettings = {...settings}
	// If Peer Block Filters is on -> Block Filter Index must also be on
	if (newSettings['peerblockfilters']) newSettings['blockfilterindex'] = true

	// If prune > 0 -> txindex must be off
	if (newSettings['prune'] > 0) newSettings['txindex'] = false

	// If proxy is on, but onlynet doesn't include clearnet and tor -> disable proxy
	if (
		newSettings['proxy'] &&
		(!newSettings['onlynet'].includes('clearnet') || !newSettings['onlynet'].includes('tor'))
	) {
		newSettings['proxy'] = false
	}

	return newSettings
}

// Load from disk -> merge defaults -> validate. */
async function loadAndValidateSettings(): Promise<SettingsSchema> {
	const partial = await fse.readJson(SETTINGS_JSON).catch(() => ({}))

	// If we're in dev and no settings.json exists yet (e.g., first run), use the DEFAULT_CHAIN override if set (allows us to start in regtest)
	if (!('chain' in partial) && process.env['DEFAULT_CHAIN']) {
		partial.chain = process.env['DEFAULT_CHAIN']
	}

	return settingsSchema.parse(mergeWithDefaults(partial))
}

// Writes out each setting as a line in the umbrel-bitcoin.conf file
// Handles multiple settings with the same key (onlynet, listen)
function generateBaseConfLines(settings: SettingsSchema): string[] {
	const lines: string[] = []

	for (const key of Object.keys(settings) as (keyof SettingsSchema)[]) {
		const value = settings[key]

		switch (key) {
			// "onlynet": turn each named network into one or more "onlynet=..." lines
			case 'onlynet': {
				const nets = value as string[]
				const map: Record<string, string[]> = {
					clearnet: ['onlynet=ipv4', 'onlynet=ipv6'],
					tor: ['onlynet=onion'],
					i2p: ['onlynet=i2p'],
				}
				for (const n of nets) {
					if (map[n]) {
						lines.push(...map[n])
					}
				}
				break
			}

			// "listen": turn on clearnet, tor, and i2p listeners
			case 'listen': {
				const nets = value as string[]
				const flag = (enabled: boolean) => (enabled ? 1 : 0)
				// We always set listen=1 no matter what so that internal apps like Electrs can connect
				// A user would not accept incoming clearnet connections unless they explicitely port forward from their router
				lines.push('listen=1')
				lines.push(`listenonion=${flag(nets.includes('tor'))}`)
				lines.push(`i2pacceptincoming=${flag(nets.includes('i2p'))}`)
				break
			}

			// All other keys → default "key=value" (boolean→0|1, number/string as is)
			default: {
				if (typeof value === 'boolean') {
					lines.push(`${key}=${value ? 1 : 0}`)
				} else if (typeof value === 'number' || typeof value === 'string') {
					lines.push(`${key}=${value}`)
				}
				break
			}
		}
	}

	return lines
}

// HANDLERS FOR SPECIFIC SETTINGS

// If "torProxyForClearnet" is true, set proxy=<tor-proxy-ip>:<tor-proxy-port>
function handleTorProxy(lines: string[], settings: SettingsSchema): string[] {
	// Remove any existing "proxy=" lines first
	const withoutProxy = lines.filter((line) => !line.startsWith('proxy='))
	if (settings['torProxyForClearnet']) {
		withoutProxy.push(`proxy=${process.env['TOR_HOST']}:${process.env['TOR_SOCKS_PORT']}`)
	}
	return withoutProxy
}

function handleTor(lines: string[], settings: SettingsSchema): string[] {
	const torOut = settings['onlynet'].includes('tor')
	const torIn = settings['listen'].includes('tor')

	if (torOut || torIn) {
		lines = lines.filter((l) => !l.startsWith('onion='))
		lines.push(`onion=${process.env['TOR_HOST']}:${process.env['TOR_SOCKS_PORT']}`)
	}
	if (torIn) {
		lines = lines.filter((l) => !l.startsWith('torcontrol='))
		lines.push(
			`torcontrol=${process.env['TOR_HOST']}:${process.env['TOR_CONTROL_PORT']}`,
			`torpassword=${process.env['TOR_CONTROL_PASSWORD']}`,
		)
	}
	return lines
}

function handleI2P(lines: string[], settings: SettingsSchema): string[] {
	const i2pOut = settings['onlynet'].includes('i2p')
	const i2pIn = settings['listen'].includes('i2p')

	if (i2pOut || i2pIn) {
		lines = lines.filter((l) => !l.startsWith('i2psam='))
		lines.push(`i2psam=${process.env['I2P_HOST']}:${process.env['I2P_SAM_PORT']}`)
	}
	return lines
}

function handlePruneConversion(lines: string[], settings: SettingsSchema): string[] {
	// if prune > 0 convert from GB to MiB (1 GB = 953.674 MiB)
	if (settings['prune'] > 0) {
		lines = lines.filter((l) => !l.startsWith('prune='))
		lines.push(`prune=${Math.round(settings['prune'] * 953.674)}`)
	}
	return lines
}

// HANDLERS FOR LINES WE ALWAYS ADD TO umbrel-bitcoin.conf

function appendPeerWhitelist(lines: string[]): string[] {
	if (process.env['APPS_SUBNET']) {
		lines.push(`whitelist=${process.env['APPS_SUBNET']}`)
	}
	lines.push('whitelist=127.0.0.1')
	return lines
}

function appendRpcAuth(lines: string[]): string[] {
	lines.push(
		`rpcauth=${process.env['RPC_AUTH'] || 'umbrel:5071d8b3ba93e53e414446ff9f1b7d7b$6d45cff9f3b500d78b543211f6bc74994448f1f35bfd313ddde834b42e7b5f73'}`,
	)
	return lines
}

function appendRpcAllowIps(lines: string[]): string[] {
	if (process.env['APPS_SUBNET']) {
		lines.push(`rpcallowip=${process.env['APPS_SUBNET']}`)
	}
	lines.push('rpcallowip=127.0.0.1')
	return lines
}

function appendZmqPubs(lines: string[]): string[] {
	lines.push(`zmqpubrawblock=tcp://0.0.0.0:${process.env['ZMQ_RAWBLOCK_PORT'] || '28332'}`)
	lines.push(`zmqpubrawtx=tcp://0.0.0.0:${process.env['ZMQ_RAWTX_PORT'] || '28333'}`)
	lines.push(`zmqpubhashblock=tcp://0.0.0.0:${process.env['ZMQ_HASHBLOCK_PORT'] || '28334'}`)
	lines.push(`zmqpubsequence=tcp://0.0.0.0:${process.env['ZMQ_SEQUENCE_PORT'] || '28335'}`)
	return lines
}

// Append the "[chain]" network stanza with lines that must be present under a network stanza when not running on mainnet.
// port, bind, rpcport, rpcbind
function appendNetworkStanza(lines: string[], settings: SettingsSchema): string[] {
	const net = settings['chain'] ?? 'main'
	lines.push('') // blank spacer
	lines.push(`[${net}]`) // e.g. "[signet]", "[main]", etc

	// p2p and tor binds
	lines.push(`port=${process.env['P2P_PORT'] || '8333'}`)
	lines.push(`bind=0.0.0.0:${process.env['P2P_PORT'] || '8333'}`)
	lines.push(`bind=${process.env['BITCOIND_IP']}:${process.env['TOR_PORT'] || '8334'}=onion`)

	// rpc binds
	lines.push(`rpcport=${process.env['RPC_PORT'] || '8332'}`)
	lines.push(`rpcbind=${process.env['BITCOIND_IP']}`)
	lines.push('rpcbind=127.0.0.1')

	return lines
}

function generateConfLines(settings: SettingsSchema): string[] {
	let lines = generateBaseConfLines(settings)

	// apply specific rules for certain settings that depend on other settings
	lines = handleTorProxy(lines, settings)
	lines = handleTor(lines, settings)
	lines = handleI2P(lines, settings)
	lines = handlePruneConversion(lines, settings)

	// append lines that we always want to be present
	lines = appendPeerWhitelist(lines)
	lines = appendRpcAllowIps(lines)
	lines = appendZmqPubs(lines)
	lines = appendRpcAuth(lines)
	lines = appendNetworkStanza(lines, settings)

	return lines
}

// Write out umbrel-bitcoin.conf atomically
async function writeUmbrelConf(settings: SettingsSchema): Promise<void> {
	const lines = generateConfLines(settings)

	// Ensure a POSIX‐style trailing newline
	const payload = lines.join('\n') + '\n'

	await writeWithBackup(UMBREL_CONF, payload)
}

async function ensureIncludeLine() {
	await fse.ensureFile(BITCOIN_CONF)

	const current = await fse.readFile(BITCOIN_CONF, 'utf8').catch(() => '')

	// return early if the banner is already present
	if (current.startsWith(BITCOIN_CONF_BANNER)) return

	const newContents = `${BITCOIN_CONF_BANNER}\n${current}`

	await writeWithBackup(BITCOIN_CONF, newContents)
}

// Called at server startup (before launching bitcoind):
export async function ensureConfig(): Promise<SettingsSchema> {
	await fse.ensureDir(BITCOIN_DIR)

	// Write out settings.json
	const settings = applyDerivedSettings(await loadAndValidateSettings())
	const contents = JSON.stringify(settings, null, 2) + '\n'
	await writeWithBackup(SETTINGS_JSON, contents)

	// Write umbrel-bitcoin.conf + ensure include line in bitcoin.conf
	await writeUmbrelConf(settings)
	await ensureIncludeLine()

	return settings
}

// METHODS CALLED BY API ROUTES

// Get current settings
export async function getSettings(): Promise<SettingsSchema> {
	if (!cachedSettings) cachedSettings = await loadAndValidateSettings()
	return cachedSettings
}

// Update settings.json, umbrel-bitcoin.conf + bitcoin.conf, and restarts bitcoind
export async function updateSettings(patch: Partial<SettingsSchema>): Promise<SettingsSchema> {
	const current = await getSettings()

	// Merge patch → new object → validate via Zod
	const merged = applyDerivedSettings(settingsSchema.parse({...current, ...patch}))

	// Save the new settings.json
	const jsonPayload = JSON.stringify(merged, null, 2) + '\n'
	await writeWithBackup(SETTINGS_JSON, jsonPayload)

	// Write and save the new umbrel-bitcoin.conf, derived from the new settings.json
	await writeUmbrelConf(merged)

	// Ensure bitcoin.conf has "includeconf=umbrel-bitcoin.conf"
	await ensureIncludeLine()

	// Restart bitcoind so changes take effect
	await restart()

	// Update in‐memory settings cache if we were successful
	cachedSettings = merged
	return merged
}

// Get custom options from bitcoin.conf file
// Return only the lines after the banner lines that includeconf=umbrel-bitcoin.conf
export async function getCustomOptions(): Promise<string> {
	await fse.ensureFile(BITCOIN_CONF)

	const full = await fse.readFile(BITCOIN_CONF, 'utf8')

	// Slice off the banner text
	let extra = full.startsWith(BITCOIN_CONF_BANNER) ? full.slice(BITCOIN_CONF_BANNER.length) : full

	return extra.replace(/^\n/, '').trimEnd()
}

// Overwrite bitcoin.conf with our banner + user-supplied lines.
// Accepts any text: comments (#), blank lines, section headers, etc.
export async function updateCustomOptions(rawText: string): Promise<string> {
	// Normalise line endings and trim trailing whitespace
	const userLines = rawText.replace(/\r\n/g, '\n').trimEnd()

	const newContents = userLines ? `${BITCOIN_CONF_BANNER}\n${userLines}\n` : `${BITCOIN_CONF_BANNER}\n`

	await writeWithBackup(BITCOIN_CONF, newContents)

	// Restart bitcoind so the new config is applied
	await restart()

	return userLines
}
