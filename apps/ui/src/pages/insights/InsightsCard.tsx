import {Card} from '@/components/ui/card'
import {GradientBorderFromTop} from '@/components/shared/GradientBorders'
import {cn} from '@/lib/utils'

export default function InsightCard({className, children, ...rest}: React.ComponentPropsWithoutRef<typeof Card>) {
	return (
		<Card {...rest} className={cn('bg-card-gradient backdrop-blur-2xl border-none rounded-3xl py-4', className)}>
			<GradientBorderFromTop />
			{children}
		</Card>
	)
}
