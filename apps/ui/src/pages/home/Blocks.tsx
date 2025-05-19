// Placeholder for blocks component
export default function BlocksPage() {
	return (
		<div className='w-full h-full bg-white/2.5 backdrop-blur-2xl rounded-lg border-[0.5px] border-white/10 p-4 flex space-x-4'>
			{[...Array(5)].map((_, i) => (
				<div key={i} className='w-[125px] h-[125px] bg-orange-500/20 rounded-md border-[0.5px] border-white/10' />
			))}
		</div>
	)
}
