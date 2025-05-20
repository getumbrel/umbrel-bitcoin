// src/lib/timeAgoShort.ts
import {formatDistanceToNowStrict} from 'date-fns'

/** returns "3h", "5m", "12s", "2d" */
export function timeAgoShort(unixSeconds: number): string {
	const long = formatDistanceToNowStrict(unixSeconds * 1000, {addSuffix: false})
	// long → "3 minutes" | "1 hour" | "2 days"
	const [value, unit] = long.split(' ')

	const suffix = unit.startsWith('second')
		? 's'
		: unit.startsWith('minute')
			? 'm'
			: unit.startsWith('hour')
				? 'h'
				: unit.startsWith('day')
					? 'd'
					: unit.startsWith('month')
						? 'mo'
						: unit.startsWith('year')
							? 'y'
							: ''

	return `${value}${suffix}`
}
