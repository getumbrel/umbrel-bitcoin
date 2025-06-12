import {spawn, ChildProcessWithoutNullStreams, execFileSync} from 'node:child_process'
import {EventEmitter} from 'node:events'
import {Readable} from 'node:stream'
import readline from 'node:readline'

import type {ExitInfo} from '@umbrel-bitcoin/shared-types'

import {BITCOIND_BIN, BITCOIN_DIR} from '../../lib/paths.js'

export const RPC_PORT = process.env['RPC_PORT'] || '8332'
export const RPC_USER = process.env['RPC_USER'] || 'bitcoin'
export const RPC_PASS = process.env['RPC_PASS'] || 'supersecretpassword'

type BitcoindProcess = ChildProcessWithoutNullStreams & {
	stdout: Readable
	stderr: Readable
}

type BitcoindManagerOptions = {
	binary?: string
	datadir?: string
	extraArgs?: string[]
}

type LogFn = Console['log']

// Pipe each complete line from `src` to `logFn`, prefixed with [bitcoind].
// NOTE: Readable stream emits a data event for every chunk it receives.
// Each chunk wakes the event-loop and runs the callback below.
// I need to check if bitcoind is chatty enough in IBD that this could be a problem.
// The callback below is tiny, so shouldn't be a problem. But need to double check that
// we don't starve other work on the event loop.
function pipeBitcoindLines(src: Readable, logFn: LogFn) {
	const rl = readline.createInterface({input: src})
	rl.on('line', (line) => {
		const trimmed = line.trim()
		if (trimmed) logFn('[bitcoind]', trimmed)
	})
}

export class BitcoindManager {
	private child: BitcoindProcess | null = null
	private readonly bin: string
	private readonly datadir: string
	private readonly extraArgs: string[]
	private readonly _versionInfo: {implementation: string; version: string}
	private startedAt: number | null = null
	private lastError: Error | null = null
	private _exitInfo: ExitInfo | null = null

	// Ring buffer for the last N log lines (stderr+stdout)
	// We use this to show the last N log lines in the UI when bitcoind crashes
	private readonly logRing: string[] = []
	private readonly RING_MAX = 200
	private recordLine = (line: string) => {
		if (this.logRing.push(line) > this.RING_MAX) this.logRing.shift()
	}

	// EventEmitter that fires `"exit"` with an `ExitInfo` payload
	// We use this to notify the UI when bitcoind crashes
	public readonly events = new EventEmitter()
	// flag to prevent emitting an exit event if we are purposefully stopping bitcoind (e.g., changing config via the UI)
	private expectingExit = false

	// TODO: finalize hardcoded args and allow extraArgs from env vars
	constructor({binary = BITCOIND_BIN, datadir = BITCOIN_DIR, extraArgs = []}: BitcoindManagerOptions = {}) {
		this.bin = binary
		this.datadir = datadir
		this.extraArgs = [
			// TODO: change to rpcauth
			`-rpcuser=${RPC_USER}`,
			`-rpcpassword=${RPC_PASS}`,
			`-rpcport=${RPC_PORT}`,
			'-zmqpubhashblock=tcp://127.0.0.1:28332',
			...extraArgs,
		]

		// We grab the implementation and version here once so the UI can query it without needing to wait for RPC to be available (e.g., if bitcoind is down or still starting up)
		try {
			// Grab the first line of bitcoind --version output
			// e.g., "Bitcoin Core daemon version v29.0.0"
			const firstLine = execFileSync(this.bin, ['--version']).toString().split('\n')[0]

			// implementation = everything before the word “version …”
			// e.g., "Bitcoin Core"
			const implementation = firstLine.replace(/(?:daemon|RPC client)?\s*version.*$/i, '').trim()

			// version = first vX.Y.Z
			// e.g., "v29.0.0"
			const version = (firstLine.match(/v\d+\.\d+\.\d+/) ?? ['unknown'])[0]

			this._versionInfo = {implementation, version}
		} catch (error) {
			this._versionInfo = {implementation: 'unknown', version: 'unknown'}
			console.error('[bitcoind-manager] failed to get static version:', error)
		}
	}

	public get versionInfo() {
		return this._versionInfo
	}

	// Returns latest bitcoind crash snapshot, or `null` if the node is running / never crashed
	public get exitInfo(): ExitInfo | null {
		return this._exitInfo
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
		}) as BitcoindProcess

		this.lastError = null
		console.log('[bitcoind-manager] spawned PID', this.child.pid)

		// Capture stdout and log + record to ring buffer
		pipeBitcoindLines(this.child.stdout, (prefix, line) => {
			console.log(prefix, line)
			this.recordLine(line)
		})

		// Capture stderr and log + record to ring buffer
		pipeBitcoindLines(this.child.stderr, (prefix, line) => {
			console.error(prefix, line)
			this.recordLine(line)
		})

		this.child.on('exit', (code, sig) => {
			console.error(`[bitcoind] exited (code=${code}, sig=${sig})`)

			// Skip emitting crash info if we expected this exit
			if (this.expectingExit) return

			this._exitInfo = {
				code,
				sig,
				logTail: [...this.logRing],
				message: `Bitcoin Core stopped (code ${code ?? 'null'})`,
			}

			this.events.emit('exit', this._exitInfo)
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
