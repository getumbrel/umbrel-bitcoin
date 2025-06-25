import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {TriangleAlert} from 'lucide-react'

export default function DangerZoneAlert() {
	return (
		<Alert className='bg-[#EDCE0017] text-[#EDCE00] border-none'>
			<TriangleAlert className='h-4 w-4' />
			<AlertTitle className='text-[#EDCE00]'>Danger Zone</AlertTitle>
			<AlertDescription className='text-[#EDCE00]'>
				Any changes you make here are not validated. Please ensure that you know what you are doing, and that you
				understand how changes may impact both your Bitcoin node and any apps or wallets that rely on it.
			</AlertDescription>
		</Alert>
	)
}
