// TODO: Placeholder for status dot component
// create dynamic status
export default function StatusDot() {
	return (
		<span className='relative inline-flex items-center' role='status' aria-label='running'>
			{/* halo */}
			<span className='absolute inset-0 rounded-full bg-[#0BC39E] blur-[2px]' />
			{/* solid core */}
			<span className='relative inline-block h-2 w-2 rounded-full bg-[#0BC39E] shadow' />
		</span>
	)
}
