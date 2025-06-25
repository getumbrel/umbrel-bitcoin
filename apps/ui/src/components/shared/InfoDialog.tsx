import React from 'react'
import {X as XIcon} from 'lucide-react'

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'

interface InfoDialogProps {
	trigger: React.ReactNode
	title: string
	description: string
	className?: string
}

export default function InfoDialog({trigger, title, description, className}: InfoDialogProps) {
	return (
		<Dialog>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent
				className={`sm:max-w-[425px] bg-card-gradient backdrop-blur-2xl border-white/10 border-[0.5px] rounded-2xl ${className || ''}`}
				showCloseButton={false}
			>
				<DialogClose asChild>
					<button className='absolute top-4 right-4 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors'>
						<XIcon className='w-3 h-3 text-white/70' />
					</button>
				</DialogClose>
				<DialogHeader>
					<DialogTitle className='text-white text-left'>{title}</DialogTitle>
					<DialogDescription className='text-white/60 whitespace-pre-line text-left'>{description}</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	)
}
