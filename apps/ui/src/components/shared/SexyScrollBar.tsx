import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import {cn} from '@/lib/utils'

type SBProps = React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>

// 3px thick scrollbar thumb with no visible track
export function SexyScrollBar({className, orientation = 'vertical', ...props}: SBProps) {
	return (
		<ScrollAreaPrimitive.ScrollAreaScrollbar
			orientation={orientation}
			className={cn(
				'',
				orientation === 'vertical' ? 'h-full w-[3px] -mr-[20px]' : 'h-[3px] w-full flex flex-col',
				className,
			)}
			{...props}
		>
			<ScrollAreaPrimitive.ScrollAreaThumb
				className={cn(
					'rounded-full bg-[hsla(0,0%,100%,0.15)] hover:bg-[hsla(0,0%,100%,0.25)]',
					orientation === 'horizontal' ? 'flex-1' : '',
				)}
			/>
		</ScrollAreaPrimitive.ScrollAreaScrollbar>
	)
}
