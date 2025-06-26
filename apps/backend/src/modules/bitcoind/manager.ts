import {spawn, ChildProcessWithoutNullStreams, execFileSync} from 'node:child_process'
import {EventEmitter} from 'node:events'
import {Readable} from 'node:stream'
import readline from 'node:readline'

import type {ExitInfo} from '#types'

import {BITCOIND_BIN, BITCOIN_DIR} from '../../lib/paths.js'

type BitcoindManagerOptions = {
	binary?: string
	datadir?: string
	extraArgs?: string[]
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

export class BitcoindManager {
	private child: ChildProcessWithoutNullStreams | null = null
	private readonly bin: string
	private readonly datadir: string
	private readonly extraArgs: string[]
	public readonly versionInfo: {implementation: string; version: string}
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
			.split(/\s+/) // splits on spaces, tabs, or newlines
			.filter(Boolean) // removes empty strings

		this.extraArgs = [
			...extraArgs, // from caller
			...envArgs, // from env var (e.g., in Docker Compose)
		]

		// We grab the implementation and version here once so the UI can query it without needing to wait for RPC to be available (e.g., if bitcoind is down or still starting up)
		try {
			// Grab the first line of bitcoind --version output
			// e.g., "Bitcoin Core daemon version v29.0.0"
			const firstLine = execFileSync(this.bin, ['--version']).toString().split('\n')[0]

			// implementation = everything before the word "version …"
			// e.g., "Bitcoin Core"
			const implementation = firstLine.replace(/(?:daemon|RPC client)?\s*version.*$/i, '').trim()

			// version = first vX.Y.Z
			// e.g., "v29.0.0"
			const version = (firstLine.match(/v\d+\.\d+\.[\w\d\.]+/) ?? ['unknown'])[0]

			this.versionInfo = {implementation, version}
		} catch (error) {
			this.versionInfo = {implementation: 'unknown', version: 'unknown'}
			console.error('[bitcoind-manager] failed to get static version:', error)
		}
	}

	setLastError(err: Error): void {
		this.lastError = err
	}

	// Spawn bitcoind as a child process
	// TODO: decide if we want to auto-restart on exit ever
	start() {
		// return early if already running
		if (this.child) return

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
