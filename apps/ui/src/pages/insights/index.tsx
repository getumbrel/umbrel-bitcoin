import RewardsChart from './RewardsChart'
import PeersTable from './PeersTable'

export default function InsightsPage() {
	return (
		<div className='flex flex-col gap-10'>
			<PeersTable />
			<RewardsChart />
		</div>
	)
}
