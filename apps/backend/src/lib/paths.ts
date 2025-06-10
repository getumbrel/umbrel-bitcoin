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

// Ensure that the required data directories exist
export async function ensureDirs() {
	await Promise.all([fse.ensureDir(BITCOIN_DIR), fse.ensureDir(APP_STATE_DIR)])
}
