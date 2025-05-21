import {Card, CardHeader, CardTitle} from '@/components/ui/card'
import {GradientBorderFromTop} from '@/components/shared/GradientBorders'

export default function SettingsPage() {
	return (
		<Card className='bg-card-gradient backdrop-blur-2xl border-none rounded-3xl py-4 h-[1000px]'>
			<GradientBorderFromTop />
			<CardHeader>
				<CardTitle className='font-outfit text-white text-[20px] font-[400] pt-2'>Settings</CardTitle>
			</CardHeader>
		</Card>
	)
}
