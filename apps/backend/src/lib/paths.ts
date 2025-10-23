import path from 'node:path'
import {fileURLToPath} from 'node:url'
import fse from 'fs-extra'

// bitcoind binary
export const BITCOIND_BIN = process.env['BITCOIND_BIN'] || 'bitcoind'

// Absolute path to the monorepo root
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../')

// bitcoind -datadir (data/bitcoin)
export const BITCOIN_DIR = process.env['BITCOIN_DIR'] || path.join(REPO_ROOT, 'data', 'bitcoin')

// app config data dir (data/app)
export const APP_STATE_DIR = process.env['APP_STATE_DIR'] || path.join(REPO_ROOT, 'data', 'app')

// settings.json file path
export const SETTINGS_JSON = path.join(APP_STATE_DIR, 'settings.json')

// bitcoin.conf file paths
export const BITCOIN_CONF = path.join(BITCOIN_DIR, 'bitcoin.conf')
export const UMBREL_BITCOIN_CONF = path.join(BITCOIN_DIR, 'umbrel-bitcoin.conf')

// Bitcoin Core installation path for bitcoind versions
export const BITCOIN_CORE_VERSIONS_DIR = '/opt/bitcoind'

// Symbolic link for default bitcoind binary
export const BITCOIN_CORE_CURRENT_SYMLINK = `${BITCOIN_CORE_VERSIONS_DIR}/current`

// Ensure that the required data directories exist
export async function ensureDirs() {
	await Promise.all([fse.ensureDir(BITCOIN_DIR), fse.ensureDir(APP_STATE_DIR)])
}
