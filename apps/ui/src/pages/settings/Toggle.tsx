import {Switch} from '@/components/ui/switch'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'

interface ToggleProps {
	name: string
	checked: boolean
	disabled?: boolean
	onToggle: (v: boolean) => void
	disabledMessage?: string
}

export default function Toggle({name, checked, disabled, onToggle, disabledMessage}: ToggleProps) {
	const core = (
		<Switch
			name={name}
			checked={checked}
			onCheckedChange={onToggle}
			disabled={disabled}
			className='h-[20px] w-[36px] border-2 shadow-[0_0_8.36px_0_hsla(29_100%_51%_0.2)]
                 data-[state=unchecked]:bg-[hsl(0_0%_15%)]
                 data-[state=checked]:bg-[hsl(29_100%_47%)]
                 data-disabled:bg-[hsl(0_0%_15%)]
                 [&>[data-state]]:bg-white
                 [&>[data-state]]:shadow-lg
                 [&>[data-state=checked]]:translate-x-4'
		/>
	)

	// show tooltip only when disabled AND we have a message
	if (disabled && disabledMessage) {
		return (
			<TooltipProvider delayDuration={300}>
				<Tooltip>
					<TooltipTrigger asChild>{core}</TooltipTrigger>
					<TooltipContent side='left' className='max-w-xs text-center'>
						{disabledMessage}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	}
	return core
}
