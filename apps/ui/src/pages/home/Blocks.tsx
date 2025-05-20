// Placeholder for blocks component
export default function BlocksPage() {
	return (
		<div className='w-full h-full flex space-x-4'>
			{[...Array(5)].map((_, i) => (
				<div
					key={i}
					className='w-[150px] h-[150px] bg-card-gradient border-[0.5px] border-white/6 backdrop-blur-xl'
				></div>
			))}
		</div>
	)
}
