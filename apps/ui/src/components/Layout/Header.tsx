import clsx from 'clsx'
import {cn} from '@/lib/utils'

// We import SVGs as React components via `?react` (SVGR):
// This inlines the <svg>, so there's no extra HTTP request.
// It also gives us the same behaviors as normal DOM elements—easy to size, recolor, and animate.
import Logo from '@/assets/logo.svg?react'

import ConnectionDetails from '@/components/ConnectionDetails'
import {useBitcoindVersion} from '@/hooks/useBitcoind'

export default function Header({className}: {className?: string}) {
	const {data: version, isLoading, isError} = useBitcoindVersion()

	// placeholder text to prevent layout shift and fall back on error
	const placeholder = 'Bitcoin Core'

	// Remove the 'v' prefix from the version string if it exists
	const cleanedVersion = version?.version?.replace(/^v/i, '')
	const fullVersionString = `${placeholder} ${cleanedVersion ?? ''}`

	return (
		<header className={cn('flex items-end md:items-center justify-between mb-8 w-full', className)}>
			<div className='flex flex-col md:flex-row md:items-center gap-3.5'>
				<Logo aria-label='Bitcoin Node logo' className='w-[38px] md:w-[60px] h-[38px] md:h-[60px] shrink-0' />
				<div>
					<h1 className='font-outfit text-[25px] md:text-[28px] font-[400] bg-text-gradient bg-clip-text text-transparent leading-none pb-2 md:pb-1'>
						Bitcoin Node
					</h1>

					{/* We gracefully handle loading and error states for no layout shift */}
					<p className='text-[14px] md:text-[16px] leading-none font-[400] text-white/35'>
						<span
							className={clsx(
								'inline-block transition-opacity duration-500 ease-in-out',
								isLoading ? 'opacity-0 select-none' : 'opacity-100',
							)}
						>
							{isLoading || isError ? placeholder : fullVersionString}
						</span>
					</p>
				</div>
			</div>
			<div>
				{/* Connect button + modal */}
				<ConnectionDetails />
			</div>
		</header>
	)
}
