// TODO: break out some config-helpers into a separate file
// TODO: make sure we're error handling sanely and not over-try-catching.
// TODO: handle bitcoind not starting after a settings change, logging error to user and reverting conf files

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
	return settingsSchema.parse(mergeWithDefaults(partial))
}

// Writes out each setting as a line in the umbrel-bitcoin.conf file
// Handles multiple settings with the same key (onlynet, listen)
function generateBaseConfLines(settings: SettingsSchema): string[] {
	const lines: string[] = []

	for (const key of Object.keys(settings) as (keyof SettingsSchema)[]) {
		const value = settings[key]

		switch (key) {
			// “onlynet”: turn each named network into one or more “onlynet=…” lines
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

			// “listen”: turn on clearnet, tor, and i2p listeners
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

			// All other keys → default “key=value” (boolean→0|1, number/string as is)
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

// If “torProxyForClearnet” is true, set proxy=<tor-proxy-ip>:<tor-proxy-port>
function handleTorProxy(lines: string[], settings: SettingsSchema): string[] {
	// Remove any existing “proxy=” lines first
	const withoutProxy = lines.filter((line) => !line.startsWith('proxy='))
	if (settings['torProxyForClearnet']) {
		// TODO: set the actual tor proxy ip and port here via env vars
		withoutProxy.push('proxy=127.0.0.1:9050')
	}
	return withoutProxy
}

// Append the “[chain]” network stanza with bind addresses
function appendNetworkStanza(lines: string[], settings: SettingsSchema): string[] {
	const net = settings['chain'] ?? 'main'
	return lines.concat([
		'', // blank spacer
		`[${net}]`, // e.g. “[signet]” or “[main]”
		'bind=0.0.0.0:8333',
		// (If you ever want onion bind: e.g. `bind=${BITCOIND_IP}:8334=onion`)
	])
}

function generateConfLines(settings: SettingsSchema): string[] {
	let lines = generateBaseConfLines(settings)

	// apply specific rules for certain settings
	lines = handleTorProxy(lines, settings)
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

	const banner = [
		'# Load additional configuration file, relative to the data directory.',
		`includeconf=${path.basename(UMBREL_CONF)}`,
	].join('\n')

	const current = await fse.readFile(BITCOIN_CONF, 'utf8').catch(() => '')

	// return early if the banner is already present
	if (current.startsWith(banner)) return

	const newContents = `${banner}\n${current}`

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

	// Ensure bitcoin.conf has “includeconf=umbrel-bitcoin.conf”
	await ensureIncludeLine()

	// Restart bitcoind so changes take effect
	await restart()

	// Update in‐memory settings cache if we were successful
	cachedSettings = merged
	return merged
}
