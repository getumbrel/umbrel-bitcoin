import {spawn, ChildProcessWithoutNullStreams, execFileSync} from 'node:child_process'
import {EventEmitter} from 'node:events'
import {Readable} from 'node:stream'
import readline from 'node:readline'
import fse from 'fs-extra'

import type {ExitInfo} from '#types'
import {DEFAULT_BITCOIN_CORE_VERSION} from '#settings'

import {
	BITCOIND_BIN,
	BITCOIN_DIR,
	SETTINGS_JSON,
	BITCOIN_CORE_VERSIONS_DIR,
	BITCOIN_CORE_CURRENT_SYMLINK,
} from '../../lib/paths.js'

// Version helpers
// TODO: determine whether these would be better as async/await (and therefor entire start() as well)
function getVersionFromSettings(): string {
	try {
		const json = fse.readJsonSync(SETTINGS_JSON)
		if (typeof json.version === 'string' && json.version.length) {
			// If the version is 'latest', use the default version which is the latest available version we've packaged
			return json.version === 'latest' ? DEFAULT_BITCOIN_CORE_VERSION : json.version
		}
	} catch {}
	return DEFAULT_BITCOIN_CORE_VERSION
}

function isVersionInstalled(version: string): boolean {
	try {
		// Check if the bitcoind binary exists and is executable
		fse.accessSync(`${BITCOIN_CORE_VERSIONS_DIR}/${version}/bitcoind`, fse.constants.X_OK)
		return true
	} catch {
		return false
	}
}

// Stream helper that turns the chunked `Readable` into complete, trimmed lines
// and passes each non-empty line to a callback.
function onLine(src: Readable, callback: (line: string) => void) {
	// Prevent an unhandled error from the raw pipe from crashing the process
	src.on('error', (err) => console.error('[bitcoind-manager] stream error:', err))

	const rl = readline.createInterface({input: src})

	// Prevent an unhandled error from the readline from crashing the process
	rl.on('error', (err) => console.error('[bitcoind-manager] readline error:', err))

	rl.on('line', (raw) => {
		// In event-callback land now; any throw would bubble up uncaught and kill the process
		try {
			const line = raw.trim()
			if (line) callback(line)
		} catch (err) {
			console.error('[bitcoind-manager] onLine callback error:', err)
		}
	})
}

type BitcoindManagerOptions = {
	binary?: string
	datadir?: string
	extraArgs?: string[]
}

export class BitcoindManager {
	private child: ChildProcessWithoutNullStreams | null = null
	private readonly bin: string
	private readonly datadir: string
	private readonly extraArgs: string[]
	public versionInfo: {implementation: string; version: string}
	private startedAt: number | null = null
	private lastError: Error | null = null
	public exitInfo: ExitInfo | null = null

	// Ring buffer for the last N log lines (stderr+stdout)
	// We use this to show the last N log lines in the UI when bitcoind crashes
	private readonly logRing: string[] = []
	private readonly RING_MAX = 200
	private recordLine = (line: string) => {
		if (this.logRing.push(line) > this.RING_MAX) this.logRing.shift()
	}

	// Logs out and also saves to ring buffer
	private handleLine(line: string, isStderr: boolean) {
		const prefix = '[bitcoind]'
		void (isStderr ? console.error(prefix, line) : console.log(prefix, line))
		this.recordLine(line)
	}

	// EventEmitter that fires `"exit"` with an `ExitInfo` payload
	// We use this to notify the UI when bitcoind crashes
	public readonly events = new EventEmitter()
	// flag to prevent emitting an exit event if we are purposefully stopping bitcoind (e.g., changing config via the UI)
	private expectingExit = false

	constructor({binary = BITCOIND_BIN, datadir = BITCOIN_DIR, extraArgs = []}: BitcoindManagerOptions = {}) {
		this.bin = binary
		this.datadir = datadir

		// Grab extra flags from env, if present
		// This allows us to add extra flags in the app store compose file without changing this codebase
		const envArgs = (process.env['BITCOIND_EXTRA_ARGS'] ?? '')
			.trim()
			.split(',') // splits on commas to allow spaces in arguments
			.map((arg) => arg.trim()) // trim whitespace from each argument
			.filter(Boolean) // removes empty strings

		this.extraArgs = [
			...extraArgs, // from caller
			...envArgs, // from env var (e.g., in Docker Compose)
		]

		// Initialize displayed version to the version specified in settings.json immediately to avoid UI flashing the default symlink (which will be the latest available version)
		const versionFromSettings = getVersionFromSettings()
		const initialBinaryVersionInfo = this.getBinaryVersionInfo()
		this.versionInfo = {...initialBinaryVersionInfo, version: versionFromSettings}
	}

	setLastError(err: Error): void {
		this.lastError = err
	}

	private getBinaryVersionInfo() {
		try {
			const firstLine = execFileSync(this.bin, ['--version']).toString().split('\n')[0]
			const implementation = firstLine.replace(/(?:daemon|RPC client)?\s*version.*$/i, '').trim()
			const version = (firstLine.match(/v\d+\.\d+\.\d+/) ?? ['unknown'])[0]
			return {implementation, version}
		} catch {
			return {implementation: 'unknown', version: 'unknown'}
		}
	}

	// Spawn bitcoind as a child process
	// TODO: decide if we want to auto-restart on exit ever
	start() {
		// return early if already running
		if (this.child) return

		const version = getVersionFromSettings()

		// We ensure the requested version exists before touching the symlink
		if (!isVersionInstalled(version)) {
			// Reflect the desired version in versionInfo so the UI shows intent, not the current symlink
			this.versionInfo = {...this.versionInfo, version}
			const msg = `Bitcoin Core version "${version}" is not installed (missing: ${BITCOIN_CORE_VERSIONS_DIR}/${version}/bitcoind).`
			this.lastError = new Error(msg)
			this.exitInfo = {
				code: null,
				sig: null,
				logTail: [msg],
				message: msg,
			}
			console.error('[bitcoind-manager]', msg)
			// Notify listeners (UI websocket) immediately so the frontend can show a toast right away
			this.events.emit('exit', this.exitInfo)
			return
		}

		// flip the single pointer used by both daemon and CLI
		execFileSync('ln', ['-sfn', `${BITCOIN_CORE_VERSIONS_DIR}/${version}`, BITCOIN_CORE_CURRENT_SYMLINK])

		// Refresh binary version info (the PATH 'bitcoind' now resolves to the target bitcoind binary)
		this.versionInfo = this.getBinaryVersionInfo()

		// Clear any previous log tail
		this.logRing.length = 0

		this.startedAt = Date.now()

		this.child = spawn(this.bin, [`-datadir=${this.datadir}`, ...this.extraArgs], {
			stdio: ['pipe', 'pipe', 'pipe'],
		}) as ChildProcessWithoutNullStreams

		this.lastError = null
		console.log('[bitcoind-manager] spawned PID', this.child.pid)

		// Emit start event for zmq hashtx subscriber
		this.events.emit('start')

		// Handle stdout and stderr
		onLine(this.child.stdout, (line) => this.handleLine(line, false))
		onLine(this.child.stderr, (line) => this.handleLine(line, true))

		this.child.on('exit', (code, sig) => {
			console.error(`[bitcoind] exited (code=${code}, sig=${sig})`)

			// Skip emitting crash info if we expected this exit
			if (this.expectingExit) return

			this.exitInfo = {
				code,
				sig,
				logTail: [...this.logRing],
				message: `Bitcoin Core stopped (code ${code ?? 'null'})`,
			}

			this.events.emit('exit', this.exitInfo)
			this.child = null
		})

		// handle spawn errors
		this.child.on('error', (err) => {
			console.error('[bitcoind-manager] failed to spawn:', err)
			this.lastError = err
		})
	}

	// Gracefully stop bitcoind
	async stop() {
		if (!this.child) return

		// Emit stop event for zmq hashtx subscriber
		this.events.emit('stop')

		// we don't want to emit an exit event if we are purposefully stopping bitcoind
		this.expectingExit = true
		this.child.kill('SIGTERM')
		await new Promise((res) => this.child?.once('exit', res))
		this.expectingExit = false
		this.child = null
		this.startedAt = null
	}

	// Restart bitcoind
	async restart() {
		await this.stop()
		this.start()
	}

	// Child process status
	status() {
		return {running: !!this.child, startedAt: this.startedAt, error: this.lastError, pid: this.child?.pid ?? null}
	}
}
