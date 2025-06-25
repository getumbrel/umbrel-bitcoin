import {useEffect, useRef, useState} from 'react'
import copy from 'copy-to-clipboard'
import {toast} from 'sonner'
import clsx from 'clsx'
import {motion, AnimatePresence} from 'framer-motion'
import {useSearchParams} from 'react-router-dom'

import {Checkbox} from '@/components/ui/checkbox'
import FadeScrollArea from '@/components/shared/FadeScrollArea'

import {useBitcoindExitInfo} from '@/hooks/useBitcoindExitInfo'
import {Button} from '@/components/ui/button'

// Simple regex to filter log lines by severity (case-insensitive)
const ERROR_REGEX = /(error|fatal|panic|disk full|corrupt|invalid)/i
const WARN_REGEX = /(warn)/i

export default function BitcoindErrorLog() {
	const {data: exitInfo} = useBitcoindExitInfo()
	const [errorsOnly, setErrorsOnly] = useState(false)
	const fadeScrollRef = useRef<HTMLDivElement | null>(null)
	const componentRef = useRef<HTMLDivElement | null>(null)
	const [searchParams] = useSearchParams()

	// Auto-scroll to the bottom of the log viewer
	useEffect(() => {
		// Find the viewport within the FadeScrollArea
		const viewport = fadeScrollRef.current?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement
		if (viewport) {
			viewport.scrollTo({
				top: viewport.scrollHeight,
				behavior: 'auto',
			})
		}
	}, [exitInfo?.logTail])

	// Scroll component into view when advanced tab is active and component is rendered
	useEffect(() => {
		const currentTab = searchParams.get('tab') || 'peers'
		if (currentTab === 'advanced' && exitInfo && componentRef.current) {
			// Small delay to ensure the component is fully rendered after the AnimatePresence animation
			const timer = setTimeout(() => {
				componentRef.current?.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
				})
			}, 300) // Slightly longer than the animation duration

			return () => clearTimeout(timer)
		}
	}, [searchParams, exitInfo])

	// Filter for showing only error lines
	const visibleLines =
		errorsOnly && exitInfo ? exitInfo.logTail.filter((line) => ERROR_REGEX.test(line)) : exitInfo?.logTail || []

	// Download the log as a .txt file without navigating away from the page
	const downloadLog = () => {
		if (!exitInfo) return
		const blob = new Blob([exitInfo.logTail.join('\n')], {type: 'text/plain'})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'bitcoin-log-tail.txt'
		document.body.appendChild(a)
		a.click()
		a.remove()
		URL.revokeObjectURL(url)
	}

	return (
		<AnimatePresence>
			{exitInfo && (
				<motion.div
					ref={componentRef}
					initial={{opacity: 0, y: 10}}
					animate={{opacity: 1, y: 0}}
					exit={{opacity: 0, y: -10}}
					transition={{duration: 0.25}}
					className='mb-6 rounded-lg border border-red-900 bg-red-950/80 p-4'
				>
					<p className='mb-2 text-sm text-red-200'>
						Bitcoin Core stopped unexpectedly. Review the logs below for more information.
					</p>

					{/* scrollable log viewer with FadeScrollArea */}
					<FadeScrollArea
						ref={fadeScrollRef}
						className='h-60 rounded bg-black/55 font-mono text-xs
						           [--fade-top:rgba(0,0,0,0.4)] [--fade-bottom:rgba(0,0,0,0.4)]
						           [&_[data-orientation="vertical"]]:mr-0'
					>
						<div className='p-3 pr-1'>
							{visibleLines.map((line, i) => (
								<div
									key={i}
									className={clsx(
										// break-all to allow lines to wrap aggressively enough on mobile
										'whitespace-pre-wrap break-all',
										ERROR_REGEX.test(line) && 'text-red-400',
										!ERROR_REGEX.test(line) && WARN_REGEX.test(line) && 'text-yellow-400',
										!ERROR_REGEX.test(line) && !WARN_REGEX.test(line) && 'text-white',
									)}
								>
									{line}
								</div>
							))}
						</div>
					</FadeScrollArea>

					{/* Show errors only checkbox */}
					<label className='flex items-center gap-1 text-xs text-white/80 mt-2'>
						<Checkbox
							checked={errorsOnly}
							onCheckedChange={(checked) => setErrorsOnly(checked === true)}
							className='border-white/50 data-[state=checked]:bg-red-600'
						/>
						Show errors only
					</label>

					{/* Buttons */}
					<div className='mt-3 flex flex-wrap gap-2'>
						<Button
							type='button'
							className='bg-red-800 hover:bg-red-700 text-white transition-colors'
							onClick={() => {
								if (exitInfo) {
									copy(exitInfo.logTail.join('\n'))
									toast.success('Log copied to clipboard', {duration: 2000})
								}
							}}
						>
							Copy log
						</Button>

						<Button
							type='button'
							className='bg-red-800 hover:bg-red-700 text-white transition-colors'
							onClick={downloadLog}
						>
							Download&nbsp;.txt
						</Button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
