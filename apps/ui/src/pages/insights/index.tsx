// TODO: make sure we handle pruned nodes properly here
// TODO: make charts responsive
import BlockRewardsChart from './BlockRewardsChart'
import PeersTable from './PeersTable'
import BlockSizeChart from './BlockSizeChart'
import FeeRateChart from './FeeRateChart'
import StatSummary from './StatSummary'

export default function InsightsPage() {
	return (
		<div className='flex flex-col gap-10 pb-26'>
			<StatSummary />
			<BlockRewardsChart />
			<BlockSizeChart />
			<FeeRateChart />
			<PeersTable />
		</div>
	)
}
