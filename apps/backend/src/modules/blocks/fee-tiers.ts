import type {FeeTier, RawTransaction} from '#types'

// Total fee tier boundaries in satoshis
const TOTAL_FEE_TIERS = [
	{min: 0, max: 500}, // < 0.000005 BTC
	{min: 500, max: 1000}, // < 0.00001 BTC
	{min: 1000, max: 2500}, // < 0.000025 BTC
	{min: 2500, max: 5000}, // < 0.00005 BTC
	{min: 5000, max: 10000}, // < 0.0001 BTC
	{min: 10000, max: 25000}, // < 0.00025 BTC
	{min: 25000, max: 50000}, // < 0.0005 BTC
	{min: 50000, max: 100000}, // < 0.001 BTC
	{min: 100000, max: 250000}, // < 0.0025 BTC
	{min: 250000, max: 500000}, // < 0.005 BTC
	{min: 500000, max: 1000000}, // < 0.01 BTC
	{min: 1000000, max: 2500000}, // < 0.025 BTC
	{min: 2500000, max: 5000000}, // < 0.05 BTC
	{min: 5000000, max: 10000000}, // < 0.1 BTC
	{min: 10000000, max: Infinity}, // >= 0.1 BTC
]

// Map fee tiers to square sizes
// Lower total fees = smaller squares, higher total fees = larger squares
const tierToSize: Map<number, number> = new Map([
	[0, 1], // < 0.000005 BTC = size 1
	[1, 1], // < 0.00001 BTC = size 1
	[2, 2], // < 0.000025 BTC = size 2
	[3, 2], // < 0.00005 BTC = size 2
	[4, 3], // < 0.0001 BTC = size 3
	[5, 3], // < 0.00025 BTC = size 3
	[6, 4], // < 0.0005 BTC = size 4
	[7, 4], // < 0.001 BTC = size 4
	[8, 5], // < 0.0025 BTC = size 5
	[9, 6], // < 0.005 BTC = size 6
	[10, 7], // < 0.01 BTC = size 7
	[11, 8], // < 0.025 BTC = size 8
	[12, 9], // < 0.05 BTC = size 9
	[13, 10], // < 0.1 BTC = size 10
	[14, 10], // >= 0.1 BTC = size 10
])

/**
 * Calculate fee tiers for block visualization based on transaction fees
 * @param transactions - Array of transactions from the block
 * @param blockWeight - Total weight of the block
 * @returns Array of fee tiers for visualization
 */
export function getFeeTiers(transactions: RawTransaction[], blockWeight: number): FeeTier[] {
	// Calculate fee tiers
	const tierCounts: Map<number, number> = new Map()

	for (const tx of transactions) {
		// Skip coinbase transaction (no fee)
		if (!tx.fee) continue

		// Calculate total fee in satoshis
		const totalFeeSat = tx.fee * 100_000_000

		// Find which tier this transaction belongs to based on total fee
		const tierIndex = TOTAL_FEE_TIERS.findIndex((tier) => totalFeeSat >= tier.min && totalFeeSat < tier.max)

		if (tierIndex !== -1) {
			tierCounts.set(tierIndex, (tierCounts.get(tierIndex) || 0) + 1)
		}
	}

	// Calculate block fullness (0-1) based on weight
	// Bitcoin blocks have a max weight of 4,000,000
	const blockFullness = Math.min(blockWeight / 4_000_000, 1)

	// Calculate total grid area to fill (20x20 grid = 400 squares)
	const TOTAL_GRID_AREA = 400
	const targetArea = Math.floor(TOTAL_GRID_AREA * blockFullness * 0.9) // 90% max to leave some breathing room

	// Calculate total transactions (excluding coinbase)
	let totalFeeTxs = 0
	for (const count of tierCounts.values()) {
		totalFeeTxs += count
	}

	// Convert to array of tiers
	const tiers: FeeTier[] = []

	if (totalFeeTxs === 0) {
		// Empty block or only coinbase
		return tiers
	}

	// First pass: calculate how many squares each tier should get based on tx proportion
	const squaresPerTier: Map<number, number> = new Map()
	let totalPlannedArea = 0

	for (const [tierIndex, txCount] of tierCounts.entries()) {
		const squareSize = tierToSize.get(tierIndex) || 1
		const squareArea = squareSize * squareSize

		// Calculate ideal number of squares for this tier
		const proportion = txCount / totalFeeTxs
		const idealArea = targetArea * proportion
		const idealSquares = Math.max(1, Math.round(idealArea / squareArea))

		squaresPerTier.set(tierIndex, idealSquares)
		totalPlannedArea += idealSquares * squareArea
	}

	// Second pass: adjust if we're over/under the target area
	if (totalPlannedArea > 0) {
		const scaleFactor = targetArea / totalPlannedArea
		for (const [tierIndex, squares] of squaresPerTier.entries()) {
			const adjustedSquares = Math.max(1, Math.round(squares * scaleFactor))
			squaresPerTier.set(tierIndex, adjustedSquares)
		}
	}

	// Third pass: create the actual tier entries
	for (const [tierIndex, numSquares] of squaresPerTier.entries()) {
		const tier = TOTAL_FEE_TIERS[tierIndex]
		if (!tier) continue

		const squareSize = tierToSize.get(tierIndex) || 1
		const txCount = tierCounts.get(tierIndex) || 0

		// Create multiple entries for this tier
		for (let i = 0; i < numSquares; i++) {
			tiers.push({
				minFeerate: tier.min,
				maxFeerate: tier.max,
				txCount: Math.ceil(txCount / numSquares), // Approximate txs per square
				squareSize,
			})
		}
	}

	// Sort tiers by fee rate for consistent ordering
	tiers.sort((a, b) => a.minFeerate - b.minFeerate)

	return tiers
}
