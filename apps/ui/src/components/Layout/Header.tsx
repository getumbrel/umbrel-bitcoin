import {Button} from '@/components/ui/button'

// We import SVGs as React components via `?react` (SVGR):
// This inlines the <svg>, so there’s no extra HTTP request.
// It also gives us the same behaviors as normal DOM elements—easy to size, recolor, and animate.
import Logo from '@/assets/logo.svg?react'
import WalletIcon from '@/assets/wallet.svg?react'
import {GradientBorderFromTop} from '@/components/shared/GradientBorders'

import {cn} from '@/lib/utils'

// TODO: configure tailwind.config.ts to use fontFamily variables (font-outfit)
export default function Header({className}: {className?: string}) {
	return (
		<header className={cn('flex items-end md:items-center justify-between mb-8 w-full', className)}>
			<div className='flex flex-col md:flex-row md:items-center gap-3.5'>
				<Logo aria-label='Bitcoin Node logo' className='w-[38px] md:w-[50px] h-[38px] md:h-[50px] shrink-0' />
				<div>
					<h1
						className='text-[25px] md:text-[28px] font-[400] bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent leading-none pb-2 md:pb-1'
						style={{fontFamily: 'Outfit Variable'}}
					>
						Bitcoin Node
					</h1>
					<p className='text-[14px] md:text-[16px] leading-none font-[400] text-[#414141]'>Bitcoin Core 29.0.0</p>
				</div>
			</div>
			<div>
				{/* TODO: tweak css to Suj's design */}
				<Button className='cursor-pointer relative overflow-hidden rounded-full bg-white/10 backdrop-blur-xl text-[13px] text-white/80 font-[500] hover:bg-white/15 hover:text-white/80'>
					<GradientBorderFromTop />
					<WalletIcon />
					<span>Connect</span>
				</Button>
			</div>
		</header>
	)
}
