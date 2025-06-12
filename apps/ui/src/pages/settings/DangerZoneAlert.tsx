import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {AlertCircle} from 'lucide-react'

export default function DangerZoneAlert() {
	return (
		<Alert className='border-yellow-700/50 bg-yellow-600/10 text-yellow-100'>
			<AlertCircle className='h-4 w-4 text-yellow-500' />
			<AlertTitle className='text-yellow-100'>Danger Zone</AlertTitle>
			<AlertDescription className='text-yellow-200/80'>
				Any changes you make here are not validated. Please ensure that you know what you are doing, and that you
				understand how changes may impact both your Bitcoin node and any apps or wallets that rely on it.
			</AlertDescription>
		</Alert>
	)
}
