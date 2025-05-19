// Placeholder for blocks component
export default function BlocksPage() {
	return (
		<div className='w-full h-full flex space-x-4'>
			{[...Array(5)].map((_, i) => (
				<div
					key={i}
					className='w-[150px] h-[150px] bg-gradient-to-b from-[#0F0F0FD9] to-[#080808] border-[0.5px] border-white/6 backdrop-blur-xl'
				></div>
			))}
		</div>
	)
}
