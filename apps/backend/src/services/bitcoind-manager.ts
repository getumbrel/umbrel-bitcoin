import {spawn, ChildProcessWithoutNullStreams, execFileSync} from 'node:child_process'
import {Readable} from 'node:stream'
import readline from 'node:readline'

import {BITCOIND_BIN, BITCOIN_DIR} from './paths.js'

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
// The callback below is tiny, so shouldn't be a problem. But I need to fouble check that
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
	private readonly versionInfo: {implementation: string; version: string}
	private lastError: Error | null = null

	constructor({binary = BITCOIND_BIN, datadir = BITCOIN_DIR, extraArgs = []}: BitcoindManagerOptions = {}) {
		this.bin = binary
		this.datadir = datadir
		this.extraArgs = [
			'-regtest',
			// '-signet',
			'-server',
			'-rpcuser=bitcoin',
			'-rpcpassword=secret',
			'-rpcport=8332',
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

			this.versionInfo = {implementation, version}
		} catch (error) {
			this.versionInfo = {implementation: 'unknown', version: 'unknown'}
			console.error('[bitcoind-manager] failed to get static version:', error)
		}
	}

	getVersionInfo() {
		return this.versionInfo
	}

	setLastError(err: Error): void {
		this.lastError = err
	}

	// Spawn bitcoind as a child process
	// TODO: decide if we want to auto-restart on exit ever
	start() {
		// return early if already running
		if (this.child) return

		// TODO: chain will be taken from conf. Other flags will need to be passed in.
		this.child = spawn(this.bin, [`-datadir=${this.datadir}`, ...this.extraArgs], {
			stdio: ['pipe', 'pipe', 'pipe'],
		}) as BitcoindProcess

		this.lastError = null
		console.log('[bitcoind-manager] spawned PID', this.child.pid)

		pipeBitcoindLines(this.child.stdout, console.log)
		pipeBitcoindLines(this.child.stderr, console.error)

		this.child.on('exit', (code, sig) => {
			console.error(`[bitcoind] exited (code=${code}, sig=${sig})`)
			this.child = null
		})

		this.child.on('error', (err) => {
			console.error('[bitcoind-manager] failed to spawn:', err)
			this.lastError = err
		})
	}

	// Graceful stop bitcoind
	async stop() {
		if (!this.child) return
		this.child.kill('SIGTERM')
		await new Promise((res) => this.child?.once('exit', res))
		this.child = null
	}

	// Restart bitcoind
	async restart() {
		await this.stop()
		this.start()
	}

	// Child process status
	status() {
		return {running: !!this.child, pid: this.child?.pid ?? null, error: this.lastError}
	}
}
