import {Button} from '../ui/button.js'

export default function ErrorFallback({onRetry}: {onRetry?: () => void}) {
	const handleRetry = onRetry ?? (() => window.location.reload())
	return (
		<div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center'>
			<p className='text-2xl font-semibold text-white/90'>Something went wrong</p>
			<p className='text-white/60'>An unexpected error occurred. Please try again.</p>
			<Button type='button' size='lg' className='cursor-pointer' onClick={handleRetry}>
				Try again
			</Button>
		</div>
	)
}
