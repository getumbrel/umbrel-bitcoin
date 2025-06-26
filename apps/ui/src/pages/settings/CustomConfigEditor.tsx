import {useState, useEffect} from 'react'
import {toast} from 'sonner'

import {Textarea} from '@/components/ui/textarea'
import {Button} from '@/components/ui/button'

import {useCustomConfig, useSaveCustomConfig} from '@/hooks/useCustomConfig'

export default function CustomConfigEditor() {
	// Fetch user's existing custom config lines from bitcoin.conf
	const {data, isLoading} = useCustomConfig()
	const save = useSaveCustomConfig()

	const [text, setText] = useState('')

	useEffect(() => {
		if (data) setText(data.lines)
	}, [data])

	// Check if the user has made changes to the custom config lines
	const isDirty = text !== (data?.lines ?? '')
	const canSave = !isLoading && !save.isPending && isDirty

	return (
		<div className='border border-white/20 rounded-lg p-4 w-full'>
			<label className='text-[14px] font-[400] text-white'>Custom bitcoin.conf overrides</label>
			<p className='text-[13px] font-[400] text-white/60'>
				Add custom bitcoin.conf options here. Any options here will override settings from the other tabs.
			</p>

			<Textarea
				className='mt-2 h-40 w-full whitespace-pre-wrap !text-[13px] text-white border border-white/20 rounded-lg p-2 resize-none
					[&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar]:bg-transparent
					[&::-webkit-scrollbar-thumb]:bg-[hsla(0,0%,100%,0.15)] [&::-webkit-scrollbar-thumb]:rounded-full
					[&::-webkit-scrollbar-thumb]:hover:bg-[hsla(0,0%,100%,0.25)]
					[&::-webkit-scrollbar-track]:bg-transparent
					[scrollbar-width:thin] [scrollbar-color:hsla(0,0%,100%,0.15)_transparent]
					focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/30'
				placeholder='# Add comments, [sections], or key=value lines here…'
				value={text}
				onChange={(e) => setText(e.target.value)}
			/>

			<Button
				type='button'
				className='mt-3'
				disabled={!canSave}
				onClick={() =>
					save.mutate(text, {
						onSuccess: () => toast.success('Overrides saved; restarting Bitcoin Knots…'),
						onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to save overrides'),
					})
				}
			>
				Save overrides
			</Button>
		</div>
	)
}
