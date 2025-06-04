// This is a wrapper around Radix’s ScrollArea that shows subtle gradient
// “hints” whenever there is more content to scroll to above or below the
// viewport.
// It also has a thin scrollbar.

// The overlays read CSS variables `--fade-top` and `--fade-bottom` so we can blend perfectly into any linear-gradient background.
// They fall back to dark greys if they’re unset.
// They can be set inline on the component

import * as React from 'react'
import {Root as ScrollRoot, Viewport as ScrollViewport, Corner as ScrollCorner} from '@radix-ui/react-scroll-area'
import {cn} from '@/lib/utils'
import {SexyScrollBar} from '@/components/shared/SexyScrollBar'

type Props = React.ComponentProps<typeof ScrollRoot>

export default function FadeScrollArea({className, children, ...props}: Props) {
	const viewportRef = React.useRef<HTMLDivElement | null>(null)
	const contentRef = React.useRef<HTMLDivElement | null>(null)
	const [showTop, setShowTop] = React.useState(false)
	const [showBottom, setShowBottom] = React.useState(false)

	const update = React.useCallback(() => {
		const vp = viewportRef.current
		if (!vp) return
		const EPS = 1
		setShowTop(vp.scrollTop > EPS)
		setShowBottom(vp.scrollHeight - vp.clientHeight - vp.scrollTop > EPS)
	}, [])

	React.useLayoutEffect(update, [update])
	React.useEffect(() => {
		const id = requestAnimationFrame(update)
		return () => cancelAnimationFrame(id)
	}, [update])
	React.useEffect(() => {
		const vp = viewportRef.current
		const ct = contentRef.current
		if (!vp || !ct) return
		vp.addEventListener('scroll', update)
		const ro = new ResizeObserver(update)
		ro.observe(ct)
		return () => {
			vp.removeEventListener('scroll', update)
			ro.disconnect()
		}
	}, [update])

	return (
		<ScrollRoot data-slot='scroll-area' className={cn('relative', className)} {...props}>
			<ScrollViewport
				ref={viewportRef}
				data-slot='scroll-area-viewport'
				className='size-full rounded-[inherit] transition-[color,box-shadow]
                   outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50
                   focus-visible:outline-1'
			>
				<div ref={contentRef}>{children}</div>
			</ScrollViewport>

			{/* gradient hints use CSS vars */}
			{showTop && (
				<div
					className='pointer-events-none absolute inset-x-0 top-0 h-20'
					style={{
						background: 'linear-gradient(to bottom, var(--fade-top, #0f0f0f) 0%, transparent 100%)',
					}}
				/>
			)}
			{showBottom && (
				<div
					className='pointer-events-none absolute inset-x-0 bottom-0 h-20'
					style={{
						background: 'linear-gradient(to top, var(--fade-bottom, #080808) 0%, transparent 100%)',
					}}
				/>
			)}

			<SexyScrollBar orientation='vertical' />
			<SexyScrollBar orientation='horizontal' />

			<ScrollCorner />
		</ScrollRoot>
	)
}
