import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {Button} from '@/components/ui/button'
import {TriangleAlert} from 'lucide-react'
import {cn} from '@/lib/utils'
import {LATEST, type VersionWarning} from '#settings'
import {useInputsDisabled} from './SettingsDisabledContext'

// Shown on the version tab when the selected Bitcoin Core version has known problems (e.g., missing security fixes)
export default function VersionWarningAlert({warning, onSwitch}: {warning: VersionWarning; onSwitch: () => void}) {
	const color = warning.critical ? 'text-[#FF6B70]' : 'text-[#FBBF24]'
	const disabled = useInputsDisabled()

	return (
		<Alert className={cn('border-none', warning.critical ? 'bg-[#ED1C2417]' : 'bg-[#FBBF2414]', color)}>
			<TriangleAlert className='h-4 w-4' />
			<AlertTitle className={color}>{warning.title}</AlertTitle>
			<AlertDescription className={cn(color, 'gap-3')}>
				<p>{warning.message}</p>
				{/* Only changes the selection; the user still saves to apply it */}
				<Button
					type='button'
					size='sm'
					onClick={onSwitch}
					disabled={disabled}
					className='bg-white/10 hover:bg-white/15 text-white text-[12px] font-[500] h-7 shadow-none'
				>
					{warning.switchTo === LATEST ? 'Switch to the latest version' : `Switch to ${warning.switchTo}`}
				</Button>
			</AlertDescription>
		</Alert>
	)
}
