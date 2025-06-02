import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import {cn} from '@/lib/utils'

type SBProps = React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>

export function SexyScrollBar({className, orientation = 'vertical', ...props}: SBProps) {
	const vertical = orientation === 'vertical'

	return (
		<ScrollAreaPrimitive.ScrollAreaScrollbar
			orientation={orientation}
			className={cn(
				'flex touch-none select-none transition-colors',
				vertical ? 'h-full w-[12px]' : 'h-3 w-full flex-col',
				className,
			)}
			{...props}
		>
			<ScrollAreaPrimitive.ScrollAreaThumb
				className={cn(
					'relative flex-1 rounded-full bg-transparent',

					// 3px wide scrollbar
					vertical
						? // vertical: 20px offset from the right edge
							'before:absolute before:top-0 before:bottom-0 before:right-[-20px] ' +
								'before:w-[3px] before:rounded-full ' +
								'before:bg-[hsla(0,0%,100%,0.15)]'
						: // horizontal: flush with bottom edge
							'before:absolute before:left-0 before:right-0 before:bottom-0 ' +
								'before:h-[3px] before:rounded-full ' +
								'before:bg-[hsla(0,0%,100%,0.15)]',
				)}
			/>
		</ScrollAreaPrimitive.ScrollAreaScrollbar>
	)
}
