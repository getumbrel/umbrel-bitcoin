import prettyMs from 'pretty-ms'

export function formatUptimeMs(uptimeMs: number): string {
	// When no uptime is available we show a dash
	if (!Number.isFinite(uptimeMs) || uptimeMs <= 0) return '—'

	// For durations under 60 seconds we render "a few seconds".
	if (uptimeMs < 60_000) return 'a few seconds'

	// For durations over 60 seconds we render a verbose string with a single unit.
	// e.g., "3 minutes", "2 hours".
	return prettyMs(uptimeMs, {verbose: true, unitCount: 1})
}

export function formatUptimeSeconds(uptimeSeconds: number): string {
	return formatUptimeMs(uptimeSeconds * 1000)
}
