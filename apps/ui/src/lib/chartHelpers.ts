export const SECONDS_PER_HOUR = 3600
export const MS_PER_HOUR = 3600000
export const BYTES_PER_MB = 1_000_000

export function bytesToMB(bytes: number): number {
	return bytes / BYTES_PER_MB
}

export function mbToBytes(mb: number): number {
	return mb * BYTES_PER_MB
}

export function satsToBTC(sats: number): number {
	return sats / 1e8
}

// Calculate hours ago from a Unix timestamp (seconds)
export function calculateHoursAgo(timestampSeconds: number): number {
	return (Date.now() / 1000 - timestampSeconds) / SECONDS_PER_HOUR
}

export function hoursToMs(hours: number): number {
	return hours * MS_PER_HOUR
}

// Slice the last 24 hours of data from a list of blocks
// TODO: remove minBlock and maxBlock from the return value if we end up not using them for graph titles
export function sliceLast24h<T extends {height: number; time: number}>(rows: T[]) {
	const cutoff = Date.now() / 1000 - 24 * SECONDS_PER_HOUR
	const slice = rows.filter((r) => r.time >= cutoff)

	return {
		slice,
		minBlock: slice[0]?.height,
		maxBlock: slice.at(-1)?.height,
	}
}

// Find the data point with the closest value to the target
// Using Array.reduce() for simplicity, but if our data gets large, we could use a binary search
// instead because block data is returned in chronological order
export function findClosestDataPoint<T>(data: T[], target: number, getKey: (item: T) => number): T | null {
	if (!data.length) return null

	return data.reduce((closest, current) =>
		Math.abs(getKey(current) - target) < Math.abs(getKey(closest) - target) ? current : closest,
	)
}
