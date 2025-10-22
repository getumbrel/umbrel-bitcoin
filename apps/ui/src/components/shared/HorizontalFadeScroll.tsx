// Horizontal scroll container with fade hints on left/right edges
// and hidden scrollbar for a cleaner look

import * as React from 'react'
import {cn} from '@/lib/utils'

type Props = {
	className?: string
	children: React.ReactNode
	fadeColor?: string // hex color for fade gradient (defaults to black)
}

export default function HorizontalFadeScroll({className, children, fadeColor = '#000000'}: Props) {
	const scrollRef = React.useRef<HTMLDivElement | null>(null)
	const [showLeft, setShowLeft] = React.useState(false)
	const [showRight, setShowRight] = React.useState(false)

	const update = React.useCallback(() => {
		const el = scrollRef.current
		if (!el) return
		const EPS = 1
		setShowLeft(el.scrollLeft > EPS)
		setShowRight(el.scrollWidth - el.clientWidth - el.scrollLeft > EPS)
	}, [])

	React.useLayoutEffect(update, [update])

	React.useEffect(() => {
		const el = scrollRef.current
		if (!el) return
		el.addEventListener('scroll', update, {passive: true})
		const ro = new ResizeObserver(update)
		ro.observe(el)
		return () => {
			el.removeEventListener('scroll', update)
			ro.disconnect()
		}
	}, [update])

	return (
		<div className='relative'>
			<div
				ref={scrollRef}
				className={cn(
					'overflow-x-auto overflow-y-hidden',
					// Hide scrollbar
					'[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
					className,
				)}
			>
				{children}
			</div>

			{/* Left fade hint */}
			{showLeft && (
				<div
					className='pointer-events-none absolute inset-y-0 left-0 w-12 md:w-20'
					style={{
						background: `linear-gradient(to right, ${fadeColor} 0%, transparent 100%)`,
					}}
				/>
			)}

			{/* Right fade hint */}
			{showRight && (
				<div
					className='pointer-events-none absolute inset-y-0 right-0 w-12 md:w-20'
					style={{
						background: `linear-gradient(to left, ${fadeColor} 0%, transparent 100%)`,
					}}
				/>
			)}
		</div>
	)
}
