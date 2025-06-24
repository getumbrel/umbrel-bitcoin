import {syncStatus} from '../sync/sync.js'
import {summary} from '../stats/stats.js'
import {rpcClient} from '../bitcoind/rpc-client.js'
import prettyBytes from 'pretty-bytes'
import type {SyncStatus} from '#types'

// Helper functions for formatting widget data
function formatBytes(bytes: number): {value: string; unit: string} {
	const [value, unit] = prettyBytes(bytes, {space: true}).split(' ')
	return {value, unit}
}

function formatHashrate(hashesPerSecond: number): {value: string; unit: string} {
	// Keeping this repetative but immediately understandable
	if (hashesPerSecond === 0) return {value: '0', unit: 'H/s'}
	if (hashesPerSecond < 1000) return {value: Math.round(hashesPerSecond).toString(), unit: 'H/s'}
	if (hashesPerSecond < 1e6) return {value: Math.round(hashesPerSecond / 1000).toString(), unit: 'kH/s'}
	if (hashesPerSecond < 1e9) return {value: Math.round(hashesPerSecond / 1e6).toString(), unit: 'MH/s'}
	if (hashesPerSecond < 1e12) return {value: Math.round(hashesPerSecond / 1e9).toString(), unit: 'GH/s'}
	if (hashesPerSecond < 1e15) return {value: Math.round(hashesPerSecond / 1e12).toString(), unit: 'TH/s'}
	if (hashesPerSecond < 1e18) return {value: Math.round(hashesPerSecond / 1e15).toString(), unit: 'PH/s'}
	if (hashesPerSecond < 1e21) return {value: Math.round(hashesPerSecond / 1e18).toString(), unit: 'EH/s'}
	return {value: Math.round(hashesPerSecond / 1e21).toString(), unit: 'ZH/s'}
}

function calcSyncPercent(syncStatus: SyncStatus | undefined): number {
	if (!syncStatus) return 0

	const {blockHeight, validatedHeaderHeight, syncProgress} = syncStatus

	// If no headers yet, we show 0%
	if (validatedHeaderHeight === 0) return 0

	// If we're synced to the tip, we show 100%
	if (blockHeight === validatedHeaderHeight) return 100

	// Otherwise use bitcoind's verificationprogress, rounded to 2 decimals
	// We floor it to ensure we don't show 100% until we're actually at the tip
	return Math.floor(syncProgress * 10000) / 100
}

export async function stats() {
	const [statsData, miningInfo] = await Promise.all([summary(), rpcClient.command('getmininginfo')])

	const mempoolFormatted = formatBytes(statsData.mempoolBytes)
	const chainFormatted = formatBytes(statsData.chainBytes)
	const hashrateFormatted = formatHashrate(miningInfo.networkhashps)

	const data = {
		type: 'four-stats',
		refresh: '5s',
		link: '',
		items: [
			{title: 'Connections', text: statsData.peers.toString(), subtext: 'peers'},
			{title: 'Mempool', text: mempoolFormatted.value, subtext: mempoolFormatted.unit},
			{title: 'Hashrate', text: hashrateFormatted.value, subtext: hashrateFormatted.unit},
			{title: 'Blockchain size', text: chainFormatted.value, subtext: chainFormatted.unit},
		],
	}

	return data
}

export async function sync() {
	const status = await syncStatus()
	const syncPercent = calcSyncPercent(status)

	// return widget data
	const testData = {
		type: 'text-with-progress',
		refresh: '2s',
		link: '',
		title: 'Blockchain sync',
		text: `${syncPercent}%`,
		progressLabel: syncPercent === 100 ? 'Synced' : 'In progress',
		progress: syncPercent / 100,
	}

	return testData
}
