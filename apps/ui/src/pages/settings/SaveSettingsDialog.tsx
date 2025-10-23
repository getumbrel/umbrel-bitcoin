import {AlertTriangle} from 'lucide-react'
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
import {AVAILABLE_BITCOIN_CORE_VERSIONS, DEFAULT_BITCOIN_CORE_VERSION, LATEST, type SettingsSchema} from '#settings'

interface SaveSettingsDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSave: () => void
	initialSettings?: SettingsSchema
	formValues: SettingsSchema
}

// Helper function to get version index for comparison
// Uses the same logic as settings.meta.ts: lower index = newer version
const getVersionIndex = (version: string): number => {
	if (version === LATEST) return 0
	return AVAILABLE_BITCOIN_CORE_VERSIONS.indexOf(version as any)
}

// Component for downgrade warning
const DowngradeWarning = ({savedVersion, formVersion}: {savedVersion: string; formVersion: string}) => {
	const newest = DEFAULT_BITCOIN_CORE_VERSION
	const savedVersionLabel = savedVersion === LATEST ? `${savedVersion} (${newest})` : savedVersion

	return (
		<span className='bg-red-500/10 border border-red-500/20 rounded-md p-3 block'>
			<span className='flex items-center gap-2 mb-2 block'>
				<AlertTriangle className='h-4 w-4 text-red-400' />
				<span className='font-medium text-red-200'>
					Version Downgrade: {savedVersionLabel} → {formVersion}
				</span>
			</span>
			<span className='text-red-200 text-xs mb-2 block'>
				Downgrading Bitcoin Core can introduce several potential issues:
			</span>
			<span className='text-red-200 text-xs block'>
				<strong>Security:</strong> Older versions may have vulnerabilities that have been fixed in newer releases.
			</span>
			<span className='text-red-200 text-xs mt-2 block'>
				<strong>Compatibility:</strong> Connected apps and services may not work properly with older versions.
			</span>
			<span className='text-red-200 text-xs mt-2 block'>
				<strong>Data:</strong> Bitcoin Core may need to reindex your local data, which can take several hours or days
				depending on your system.
			</span>
			<span className='text-red-200 text-xs mt-2 block'>
				<strong>Backup:</strong> Always backup critical data like wallet.dat files before downgrading.
			</span>
		</span>
	)
}

// Component for version pinning status
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
				upgraded to the latest Bitcoin Core version.
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

	// Determine if this is a downgrade
	const isDowngrade = isVersionChange && getVersionIndex(formVersion) > getVersionIndex(savedVersion)

	const renderDialogContent = () => {
		// Simple case: no version change
		if (!isVersionChange) {
			return <span className='text-[13px]'>Your Bitcoin node will restart to apply these settings.</span>
		}

		// Version change case: show pinning status and potentially downgrade warning
		return (
			<>
				<VersionPinningStatus formVersion={formVersion} />
				{isDowngrade && <DowngradeWarning savedVersion={savedVersion} formVersion={formVersion} />}
				<span className='text-[13px]'>Your Bitcoin node will restart to apply these settings.</span>
			</>
		)
	}

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
