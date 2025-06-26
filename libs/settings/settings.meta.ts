// This settings metadata file is used as a single source of truth for deriving the following:
// - validation schema (settings.schema.ts)
// - default settings values (defaultValues.ts)
// - The frontend settings page (React form inputs, descriptions, tool-tips, etc.)
// To add a new bitcoin.conf option, just add a new block to the `settingsMetadata` object and check that it is being written to the conf file correctly.

// Tabs for organization (used in the UI to group settings)
export type Tab = 'peers' | 'optimization' | 'rpc-rest' | 'network' | 'advanced' | 'policy'

interface BaseOption {
	tab: Tab
	label: string
	// we may want to make this optional in the future if we create settings that don't have a bitcoin label
	bitcoinLabel: string
	description: string
	subDescription?: string
}

interface NumberOption extends BaseOption {
	kind: 'number'
	min?: number
	max?: number
	step?: number
	default: number
	unit?: string
}

interface BooleanOption extends BaseOption {
	kind: 'toggle' // rendered as a Switch
	default: boolean
	disabledWhen?: Record<string, (v: unknown) => boolean>
	disabledMessage?: string
}

interface SelectOption extends BaseOption {
	kind: 'select'
	options: {value: string; label: string}[]
	default: string
}

interface MultiOption extends BaseOption {
	kind: 'multi' // ← new
	options: {value: string; label: string}[]
	default: string[] // empty array = “no onlynet lines”
	requireAtLeastOne: boolean
}

export type Option = NumberOption | BooleanOption | SelectOption | MultiOption

// TODO: add in any requested config options
// TypeScript infers the type of the object literals below based on the `kind` property.
export const settingsMetadata = {
	/* ===== Peers tab ===== */
	onlynet: {
		tab: 'peers',
		kind: 'multi',
		label: 'Outgoing Peer Connections',
		bitcoinLabel: 'onlynet',
		description: 'Select which networks you will use for outgoing peer connections.',
		options: [
			{value: 'clearnet', label: 'Clearnet'},
			{value: 'tor', label: 'Tor'},
			{value: 'i2p', label: 'I2P'},
		],
		default: ['clearnet', 'tor', 'i2p'],
		requireAtLeastOne: true,
	},

	proxy: {
		tab: 'peers',
		kind: 'toggle',
		label: 'Make All Outgoing Connections to Clearnet Peers Over Tor',
		bitcoinLabel: 'proxy',
		description:
			'Connect to peers available on the clearnet via Tor to preserve your anonymity at the cost of slightly less security.',
		default: false,
		// both clearnet and tor must be enabled to toggle this on
		disabledWhen: {
			onlynet: (v: unknown) => {
				const onlynets = v as string[]
				return !onlynets.includes('clearnet') || !onlynets.includes('tor')
			},
		},
		disabledMessage: 'Both Clearnet and Tor outgoing connections must be enabled to enable this',
	},

	listen: {
		tab: 'peers',
		kind: 'multi',
		label: 'Incoming Peer Connections',
		bitcoinLabel: 'listen, listenonion, i2pacceptincoming',
		// description:
		// 	'Allow other nodes to connect to your node. If you disable this, your node will only connect to other nodes on the network.',
		description:
			'Select which networks you will allow incoming peer connections from. This will broadcast your node to the Bitcoin network to help other nodes access the blockchain. You may need to set up port forwarding on your router to allow incoming connections from clearnet-only peers.',
		options: [
			{value: 'clearnet', label: 'Clearnet'},
			{value: 'tor', label: 'Tor'},
			{value: 'i2p', label: 'I2P'},
		],
		// By default we do not listen for incoming connections
		default: [],
		requireAtLeastOne: false,
	},

	peerblockfilters: {
		tab: 'peers',
		kind: 'toggle',
		label: 'Peer Block Filters',
		bitcoinLabel: 'peerblockfilters',
		description:
			'Share compact block filter data with connected light clients (like wallets) connected to your node, allowing them to get only the transaction information they are interested in from your node without having to download the entire blockchain. Enabling this will automatically enable Block Filter Index below.',
		subDescription:
			'⚠ This setting requires Block Filter Index to be enabled (this will be enforced automatically when you save with this setting enabled). If you disable Peer Block Filters, you will need to also manually toggle off Block Filter Index if you want to stop storing block filter data.',
		// Bitcoind Core's default for this is false
		default: true,
	},

	// If Peer Block Filters is enabled, then this will get automatically enabled when the config is written.
	blockfilterindex: {
		tab: 'peers',
		kind: 'toggle',
		label: 'Block Filter Index',
		bitcoinLabel: 'blockfilterindex',
		description:
			'Store an index of compact block filters which allows faster wallet re-scanning. In order to serve compact block filters to peers, you must also enable Peer Block Filters above.',
		subDescription:
			'⚠ To use Block Filter Index with a pruned node, you must enable it when you start the Prune Old Blocks process under the Optimization category. If your node is already pruned and Block Filter Index is off, enabling it will prevent your node from starting. To fix this while keeping Block Filter Index on, you will need to either reindex your node or turn off Prune Old Blocks.',
		// Bitcoind Core's default for this is false
		default: true,
	},

	peerbloomfilters: {
		tab: 'peers',
		kind: 'toggle',
		label: 'Peer Bloom Filters',
		bitcoinLabel: 'peerbloomfilters',
		description:
			'Enable support for BIP37, a feature used by older light clients (like wallets) to get only the transaction information they are interested in from your node without having to download the entire blockchain.',
		subDescription:
			'⚠ Bloom filters can have privacy and denial-of-service (DoS) risks, especially if your node is publicly reachable; its use is discouraged in favour of the more modern compact block filters.',
		default: false,
	},

	bantime: {
		tab: 'peers',
		kind: 'number',
		label: 'Peer Ban Time',
		bitcoinLabel: 'bantime',
		description:
			"Set the duration (in seconds) that a peer will be banned from connecting to your node if they violate protocol rules or exhibit suspicious behavior. By adjusting bantime, you can maintain your node's security and network integrity, while preventing repeat offenders from causing disruptions. A longer bantime increases the ban period, discouraging misbehavior, while a shorter bantime allows for quicker reconnections but may require more frequent manual monitoring of peer activity.",
		step: 1,
		default: 86_400,
		unit: 'sec',
	},

	maxconnections: {
		tab: 'peers',
		kind: 'number',
		label: 'Max Peer Connections',
		bitcoinLabel: 'maxconnections',
		// TODO: maybe talk about outgoing vs incoming here
		description:
			"Set the maximum number of peers your node can connect to simultaneously. By managing this, you can optimize your node's network usage and system resources based on your device's capacity. A higher value enables your node to maintain more connections, potentially improving network stability and data sharing. A lower value conserves system resources and bandwidth, which may be beneficial for devices with limited capabilities.",
		step: 1,
		default: 125,
		unit: 'peers',
	},

	maxreceivebuffer: {
		tab: 'peers',
		kind: 'number',
		label: 'Max Receive Buffer',
		bitcoinLabel: 'maxreceivebuffer',
		description:
			'Set the maximum amount of memory (in kilobytes) allocated for storing incoming data from other nodes in the network. A larger buffer size allows your node to handle more incoming data simultaneously, while a smaller size reduces memory consumption but may limit the amount of data your node can process at once.',
		step: 1,
		default: 5000,
		unit: 'KB',
	},

	maxsendbuffer: {
		tab: 'peers',
		kind: 'number',
		label: 'Max Send Buffer',
		bitcoinLabel: 'maxsendbuffer',
		description:
			'Set the maximum memory (in kilobytes) dedicated to storing outgoing data sent to other nodes in the network. A larger buffer size enables your node to send more data simultaneously, while a smaller size conserves memory but may restrict the volume of data your node can transmit at once.',
		step: 1,
		default: 5000,
		unit: 'KB',
	},

	// maxtimeadjustment - no longer in bitcoind -help-debug
	// https://github.com/bitcoin/bitcoin/pull/28956

	peertimeout: {
		tab: 'peers',
		kind: 'number',
		label: 'Peer Timeout',
		bitcoinLabel: 'peertimeout',
		description:
			"Set the maximum time (in seconds) that your node will wait for a response from a connected peer before considering it unresponsive and disconnecting. Adjusting peertimeout helps you maintain stable connections with responsive peers while ensuring your node doesn't waste resources on unresponsive ones. A shorter timeout value allows for quicker disconnection from unresponsive peers, while a longer timeout provides more time for slow-responding peers to maintain a connection.",
		step: 1,
		min: 1,
		default: 60,
		unit: 'sec',
	},

	timeout: {
		tab: 'peers',
		kind: 'number',
		label: 'Connection Timeout',
		bitcoinLabel: 'timeout',
		description:
			'Set the maximum time (in seconds) that your node will wait for a response from a newly connecting peer during the initial handshake process before considering it unresponsive and disconnecting. Fine-tuning it helps you ensure your node establishes stable connections with responsive peers while avoiding unresponsive ones. A shorter timeout value leads to faster disconnection from unresponsive peers, while a longer timeout allows more time for slow-responding peers to complete the handshake.',
		step: 1,
		min: 1,
		default: 5000,
		unit: 'ms',
	},

	maxuploadtarget: {
		tab: 'peers',
		kind: 'number',
		label: 'Max Upload Target',
		bitcoinLabel: 'maxuploadtarget',
		description:
			"Limit the maximum amount of data (in MB) your node will upload to other peers in the network within a 24-hour period. Setting this to 0 (default) means that there is no limit. By adjusting it, you can optimize your node's bandwidth usage and maintain a balance between sharing data with the network and conserving your internet resources. A higher upload target allows your node to contribute more data to the network, while a lower target helps you save bandwidth for other uses.",
		subDescription:
			'⚠ Peers that are whitelisted are exempt from this limit. By default, your node whitelists apps on your Umbrel (e.g., Electrs). However, external apps and wallets that are connected via the P2P port may fail to receive data from your node if your node hits the 24-hour upload limit.',
		min: 0,
		step: 1,
		default: 0,
		unit: 'MB/24h',
	},

	/* ===== optimizationization tab ===== */
	dbcache: {
		tab: 'optimization',
		kind: 'number',
		label: 'Cache Size',
		bitcoinLabel: 'dbcache',
		description:
			'Choose the size of the UTXO set to store in RAM. A larger cache can speed up the initial synchronization of your Bitcoin node, but after the initial sync is complete, a larger cache value does not significantly improve performance and may use more RAM than needed.',
		min: 4,
		// We don't set the max here because bitcoind will just automatically cap at 16_384 without erroring
		// and this max value has traditionally increased over time with newer releases
		// max: 16_384,
		step: 1,
		default: 450,
		unit: 'MiB',
	},

	prune: {
		tab: 'optimization',
		kind: 'number',
		label: 'Prune Old Blocks',
		bitcoinLabel: 'prune',
		description:
			'Save storage space by pruning (deleting) old blocks and keeping only a limited copy of the blockchain. It may take some time for your node to become responsive after you turn on pruning.',
		subDescription:
			'⚠ txindex is incompatible with a pruned node. It will be automatically disabled when you save with pruning enabled. Note that some connected apps and services may not work with a pruned blockchain. If you turn off pruning after turning it on, you will need to redownload the entire blockchain.',
		// bitcoind units are MiB, but we use GB here for UX
		// 1 MiB = allow manual pruning via RPC, >=550 MiB =
		// automatically prune block files to stay under the specified
		// target size in MiB
		// using GB and a step of 1 means users will never select between 1 MiB or <550 MiB behaviours described above
		default: 0, // 0 disables pruning
		step: 1,
		min: 0,
		unit: 'GB',
	},

	// TODO: should we delete the txindex dir when this is disabled?
	txindex: {
		tab: 'optimization',
		kind: 'toggle',
		label: 'Enable Transaction Indexing',
		bitcoinLabel: 'txindex',
		description: 'Enable transaction indexing to speed up transaction lookups.',
		subDescription:
			'⚠ Many connected apps and services will not work without txindex enabled, so make sure you understand the implications before disabling it. txindex is automatically disabled when pruning is enabled.',
		// bitcoin core default is false, but we our default is true
		default: true,
		/** UI hint: disable when prune > 0 */
		disabledWhen: {prune: (v: unknown) => (v as number) > 0},
		disabledMessage: 'automatically disabled when pruning is enabled',
	},

	// mempoolfullrbf - no longer an option as of Core 28.0.0

	datacarrier: {
		tab: 'policy',
		kind: 'toggle',
		label: 'Relay Transactions Containing Arbitrary Data',
		bitcoinLabel: 'datacarrier',
		description: 'Relay transactions with OP_RETURN outputs.',
		default: true,
	},

	datacarriersize: {
		tab: 'policy',
		kind: 'number',
		label: 'Max Allowed Size of Arbitrary Data in Transactions',
		bitcoinLabel: 'datacarriersize',
		description: 'Set the maximum size of the data in OP_RETURN outputs (in bytes) that your node will relay.',
		subDescription: 'Note: datacarrier must be enabled for this setting to take effect.',
		default: 83,
	},

	permitbaremultisig: {
		tab: 'policy',
		kind: 'toggle',
		label: 'Relay Bare Multisig Transactions',
		bitcoinLabel: 'permitbaremultisig',
		description: 'Relay non-P2SH multisig transactions.',
		default: true,
	},

	rejectparasites: {
		tab: 'policy',
		kind: 'toggle',
		label: 'Reject parasitic transactions',
		bitcoinLabel: 'rejectparasites',
		description: 'Reject parasitic transactions that are non-monetary.',
		default: true,
	},

	rejecttokens: {
		tab: 'policy',
		kind: 'toggle',
		label: 'Reject tokens transactions',
		bitcoinLabel: 'rejecttokens',
		description: 'Reject token transactions (runes).',
		default: false,
	},

	permitbarepubkey: {
		tab: 'policy',
		kind: 'toggle',
		label: 'Permit Bare Pubkey',
		bitcoinLabel: 'permitbarepubkey',
		description: 'Relay legacy pubkey outputs.',
		default: false,
	},

	datacarriercost: {
		tab: 'policy',
		kind: 'number',
		label: 'Datacarrier cost',
		bitcoinLabel: 'datacarriercost',
		description: 'Treat extra data in transactions as at least N vbytes per actual byte.',
		subDescription: 'Note: datacarrier must be enabled for this setting to take effect.',
		default: 1,
	},

	acceptnonstddatacarrier: {
		tab: 'policy',
		kind: 'toggle',
		label: 'Accept non standard datacarrier',
		bitcoinLabel: 'acceptnonstddatacarrier',
		description: 'Relay and mine non-OP_RETURN datacarrier injection',
		default: false,
	},

	blockmaxsize: {
		tab: 'advanced',
		kind: 'number',
		label: 'Max block size in bytes',
		bitcoinLabel: 'blockmaxsize',
		description: 'Set maximum block size in bytes.',
		default: 3985000,
	},

	blockmaxweight: {
		tab: 'advanced',
		kind: 'number',
		label: 'Max block size in weight',
		bitcoinLabel: 'blockmaxweight',
		description: 'Set maximum BIP141 block weight.',
		default: 3985000,
	},

	blockreconstructionextratxn: {
		tab: 'advanced',
		kind: 'number',
		label: 'Number of transactions to keep in memory for reconstruction',
		bitcoinLabel: 'blockreconstructionextratxn',
		description: 'Extra transactions to keep in memory for compact block reconstructions',
		default: 3985000,
	},
	
	coinstatsindex: {
		tab: 'optimization',
		kind: 'toggle',
		label: 'Coin Stats Index',
		bitcoinLabel: 'coinstatsindex',
		description: 'Enabling Coinstats Index reduces the time for the gettxoutsetinfo RPC to complete at the cost of using additional disk space.',
		default: false,
	},

	maxmempool: {
		tab: 'optimization',
		kind: 'number',
		label: 'Maximum Mempool Size',
		bitcoinLabel: 'maxmempool',
		description:
			"Set the maximum size that your node will allocate (in RAM) for storing unconfirmed transactions before they are included in a block. By adjusting maxmempool, you can optimize your node's performance and balance memory usage based on your device's capabilities. A larger maxmempool allows your node to store more unconfirmed transactions, providing more accurate statistics on explorer apps like Mempool.",
		default: 300,
		unit: 'MB',
	},

	mempoolexpiry: {
		tab: 'optimization',
		kind: 'number',
		label: 'Memory Expiration',
		bitcoinLabel: 'mempoolexpiry',
		description:
			"Set the time threshold (in hours) for unconfirmed transactions to remain in your node's mempool before being removed. By adjusting it, you can manage your node's memory usage and ensure outdated, unconfirmed transactions are discarded. A shorter expiry time helps keep your mempool up-to-date and reduces memory usage, while a longer expiry time allows transactions to remain in the pool for an extended period in case of network congestion or delayed confirmations.",
		step: 1,
		default: 336,
		unit: 'hours',
	},

	persistmempool: {
		tab: 'optimization',
		kind: 'toggle',
		label: 'Persist Mempool',
		bitcoinLabel: 'persistmempool',
		description:
			"Saves unconfirmed transactions in your node's mempool when it's shutting down and reloads them upon startup. Enabling this setting helps maintain a consistent mempool and prevents the loss of unconfirmed transactions during a restart. Disabling this setting will clear the mempool upon restart, which may reduce startup time but requires your node to rebuild its mempool from scratch.",
		default: true,
	},

	maxorphantx: {
		tab: 'optimization',
		kind: 'number',
		label: 'Max Orphan Transactions',
		bitcoinLabel: 'maxorphantx',
		description:
			"Set the maximum number of orphan transactions (transactions missing one or more of their inputs) that your node will keep in memory. By fine-tuning it, you can optimize your node's memory usage and manage its performance based on your device's capabilities. A larger limit allows your node to store more orphan transactions, potentially increasing the chances of finding missing inputs. A smaller limit conserves memory but will result in your node evicting some orphan transactions from memory when the limit is reached.",
		step: 1,
		default: 100,
		unit: 'txs',
	},

	/* ===== RPC & REST tab ===== */
	rest: {
		tab: 'rpc-rest',
		kind: 'toggle',
		label: 'Public REST API',
		bitcoinLabel: 'rest',
		description:
			'Enabling the public REST API can help you connect certain wallets and apps to your node. However, because the REST API access is unauthenticated, it can lead to unauthorized access, privacy degradation, and denial-of-service (DoS) attacks.',
		default: false,
	},

	rpcworkqueue: {
		tab: 'rpc-rest',
		kind: 'number',
		label: 'RPC Work Queue Size',
		bitcoinLabel: 'rpcworkqueue',
		description:
			'Set the maximum number of queued Remote Procedure Call (RPC) requests your node can handle (e.g., from connected wallets or other apps), helping you strike a balance between performance and resource usage. Higher values can improve processing speed at the cost of increased system resources.',
		step: 1,
		// Bitcoin Core's default is 64, but we use 128
		// No min or max in Core, but we should set a min here to avoid the user breaking the UI which relies on RPC calls to show data
		min: 1,
		default: 128,
		unit: 'threads',
	},

	/* ===== Network tab ===== */
	chain: {
		tab: 'network',
		kind: 'select',
		label: 'Bitcoin Network',
		bitcoinLabel: 'chain',
		description:
			'Choose which blockchain your node will connect to. If you change the chain, you may need to restart any connected apps to ensure they work correctly.',
		options: [
			{value: 'main', label: 'Mainnet'},
			{value: 'test', label: 'Testnet3'},
			{value: 'testnet4', label: 'Testnet4'},
			{value: 'signet', label: 'Signet'},
			{value: 'regtest', label: 'Regtest'},
		],
		default: 'main',
	},
} satisfies Record<string, Option>

function extractDefaultValues<M extends Record<string, {default: unknown}>>(meta: M) {
	const out = {} as {[K in keyof M]: M[K]['default']}
	for (const k in meta) out[k] = meta[k].default
	return out
}

export const defaultValues = extractDefaultValues(settingsMetadata)
