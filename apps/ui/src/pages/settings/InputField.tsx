import {forwardRef, type ComponentPropsWithoutRef} from 'react'
import clsx from 'clsx'
import {Input} from '@/components/ui/input'

type Props = ComponentPropsWithoutRef<'input'> & {
	unit?: string
}

const InputField = forwardRef<HTMLInputElement, Props>(({className, unit, ...rest}, ref) => (
	<div className={clsx('relative flex items-center', className)}>
		<Input
			ref={ref}
			className={clsx(
				'max-w-xs mb-4 border-none bg-[#272727] shadow-[inset_0_-1px_1px_0_rgba(255,255,255,0.2),_inset_0_1px_1px_0_rgba(0,0,0,0.36)]',
				'text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/10',
				'[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0',
				'[&[type=number]]:[-moz-appearance:textfield]',
				unit ? 'pr-12' : '', // Add padding for the unit label only if unit exists
			)}
			{...rest}
		/>
		{unit && <span className='absolute right-3 bottom-6 text-xs text-white/60 pointer-events-none'>{unit}</span>}
	</div>
))
InputField.displayName = 'InputField'
export default InputField
