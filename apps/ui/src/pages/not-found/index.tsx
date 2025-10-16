import {Link} from 'react-router-dom'
import {Button} from '../../components/ui/button'
import notFoundImg from '@/assets/404.webp'

export default function NotFoundPage() {
	return (
		<div className='flex min-h-[70vh] justify-center px-4 items-start md:items-center'>
			<div className='flex w-full max-w-screen-md flex-col items-center gap-4 text-center md:flex-row md:items-center md:gap-10 md:text-left'>
				<picture className='shrink-0'>
					<img
						src={notFoundImg}
						alt=''
						loading='lazy'
						width={280}
						height={180}
						className='w-[min(60vw,260px)] md:w-[340px] h-auto rounded-lg shadow-sm opacity-90'
					/>
				</picture>

				<div className='space-y-3'>
					<div>
						<p className='text-5xl md:text-8xl font-bold leading-none tracking-tighter bg-text-gradient bg-clip-text text-transparent'>
							404
						</p>
						<p className='mt-2 text-sm md:text-lg text-white/60'>Got lost running Bitcoin?</p>
					</div>
					<p className='text-sm md:text-base text-white/60'>
						This page doesn't exist. Check the URL or head back home.
					</p>
					<div>
						<Button asChild size='lg'>
							<Link to='/'>Go home</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
