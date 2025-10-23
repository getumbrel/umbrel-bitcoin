import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {TriangleAlert} from 'lucide-react'

export default function IncompatibleSettingsAlert() {
	return (
		<Alert className='bg-[#ED1C2417] text-[#FF6B70] border-none'>
			<TriangleAlert className='h-4 w-4' />
			<AlertTitle className='text-[#FF6B70]'>Incompatible Settings</AlertTitle>
			<AlertDescription className='text-[#FF6B70]'>
				Some settings are incompatible with the selected version of Bitcoin Core. Please review these settings in the
				tabs marked with a red dot.
			</AlertDescription>
		</Alert>
	)
}
