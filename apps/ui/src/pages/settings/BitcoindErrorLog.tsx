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

export default function BitcoindErrorLog({
	settingsViewportRef,
}: {
	settingsViewportRef?: React.RefObject<HTMLDivElement | null>
}) {
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
		if (currentTab !== 'advanced' || !exitInfo || !componentRef.current) return
	}, [searchParams, exitInfo])

	// Filter for showing only error lines
	const visibleLines: string[] =
		errorsOnly && exitInfo
			? exitInfo.logTail.filter((line: string) => ERROR_REGEX.test(line))
			: (exitInfo?.logTail ?? [])

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
					onAnimationComplete={() => {
						// After the enter animation finishes, center this error card inside the
						// scrollable settings viewport so it's immediately visible to the user.
						const settingsViewportElement = settingsViewportRef?.current
						const errorLogElement = componentRef.current
						if (!settingsViewportElement || !errorLogElement) return
						const settingsViewportRect = settingsViewportElement.getBoundingClientRect()
						const errorLogRect = errorLogElement.getBoundingClientRect()
						// Compute the element's top relative to the viewport's scroll origin
						// (accounting for current scroll position).
						const errorLogTopWithinViewport =
							errorLogRect.top - settingsViewportRect.top + settingsViewportElement.scrollTop
						// Target a scrollTop that centers the element, and clamp it within
						// [0, maxScrollable] to avoid overscrolling.
						const scrollTopTarget = Math.max(
							0,
							Math.min(
								errorLogTopWithinViewport - settingsViewportElement.clientHeight / 2 + errorLogElement.clientHeight / 2,
								settingsViewportElement.scrollHeight - settingsViewportElement.clientHeight,
							),
						)
						settingsViewportElement.scrollTo({top: scrollTopTarget, behavior: 'smooth'})
					}}
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
							onCheckedChange={(checked: boolean | 'indeterminate') => setErrorsOnly(checked === true)}
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
