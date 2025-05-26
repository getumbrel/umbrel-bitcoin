export function sliceLast24h<T extends {height: number; time: number}>(rows: T[]) {
	const cutoff = Date.now() / 1000 - 24 * 60 * 60
	const slice = rows.filter((r) => r.time >= cutoff)

	return {
		slice,
		minBlock: slice[0]?.height,
		maxBlock: slice.at(-1)?.height,
	}
}
