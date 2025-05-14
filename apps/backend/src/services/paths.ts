import path from 'node:path'
import {fileURLToPath} from 'node:url'
import fse from 'fs-extra'
// TODO: Allow env vars to override these

// bitcoind binary
// for dev-only currently (brew install bitcoin on macOS will install it at /opt/homebrew/bin/bitcoind by default)
export const BITCOIND_BIN = '/opt/homebrew/bin/bitcoind'

/** Absolute path to the repository root */
// …/apps/backend/src
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../')

/** data/bitcoin (bitcoind -datadir) */
export const BITCOIN_DIR = path.join(REPO_ROOT, 'data', 'bitcoin')

/** data/app (app config) */
export const APP_STATE_DIR = path.join(REPO_ROOT, 'data', 'app')

// Ensure that the required data directories exist
export async function ensureDirs() {
	await Promise.all([fse.ensureDir(BITCOIN_DIR), fse.ensureDir(APP_STATE_DIR)])
}
