import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {LATEST, type SettingsSchema} from '#settings'

interface SaveSettingsDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSave: () => void
	initialSettings?: SettingsSchema
	formValues: SettingsSchema
}

const VersionPinningStatus = ({formVersion}: {formVersion: string}) => {
	const isLatest = formVersion === LATEST

	if (isLatest) {
		return (
			<span className='bg-green-500/10 border border-green-500/20 rounded-md p-3 block'>
				<span className='text-green-200 text-xs'>
					You have chosen to automatically run the latest Bitcoin Core version available in the Bitcoin Node app.
				</span>
			</span>
		)
	}

	return (
		<span className='bg-orange-500/10 border border-orange-500/20 rounded-md p-3 block'>
			<span className='text-orange-200 text-xs'>
				You have chosen to stay on Bitcoin Core {formVersion} until you manually change it again in Settings. Your
				Bitcoin Node app will continue to receive updates from the Umbrel App Store, but it won't be automatically
				upgraded to the latest Bitcoin Core version available in the Bitcoin Node app.
			</span>
		</span>
	)
}

export default function SaveSettingsDialog({
	open,
	onOpenChange,
	onSave,
	initialSettings,
	formValues,
}: SaveSettingsDialogProps) {
	const savedVersion = initialSettings?.version ?? LATEST
	const formVersion = (formValues.version ?? LATEST) as string
	const isVersionChange = savedVersion !== formVersion

	const renderDialogContent = () => (
		<>
			{isVersionChange && <VersionPinningStatus formVersion={formVersion} />}
			<span className='text-[13px]'>Your Bitcoin node will restart to apply these settings.</span>
		</>
	)

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className='bg-card-gradient backdrop-blur-2xl border-white/10 border-[0.5px] rounded-2xl'>
				<AlertDialogHeader>
					<AlertDialogTitle className='font-outfit text-white text-[20px] font-[400] text-left'>
						Save changes?
					</AlertDialogTitle>
					<AlertDialogDescription className='text-white/60 text-left text-[13px] space-y-3'>
						{renderDialogContent()}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className='bg-white/90 hover:bg-white'>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							onOpenChange(false)
							onSave()
						}}
						className='hover:bg-white/10'
					>
						Yes
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
