// Individual settings are rendered dynamically from the settings metadata (libs/settings/settings.meta.ts).
// The metadata file acts as a single source of truth for deriving this UI and validation schema.

import {useEffect, useMemo, useRef, useState} from 'react'
import {useSearchParams} from 'react-router-dom'
import {useForm, FormProvider, Controller} from 'react-hook-form'
import {Search} from 'lucide-react'
import {zodResolver} from '@hookform/resolvers/zod'
import clsx from 'clsx'
import {toast} from 'sonner'

import {Card, CardHeader, CardContent, CardFooter, CardTitle} from '@/components/ui/card'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from '@/components/ui/alert-dialog'

import {GradientBorderFromTop} from '@/components/shared/GradientBorders'
import FadeScrollArea from '@/components/shared/FadeScrollArea'
import {Form} from './Form'
import Toggle from './Toggle'
import InputField from './InputField'
import {SettingsDisabledContext, useInputsDisabled} from './SettingsDisabledContext'
import DangerZoneAlert from './DangerZoneAlert'
import BitcoindErrorLog from './BitcoindErrorLog'
import CustomConfigEditor from './CustomConfigEditor'

import {settingsSchema, defaultValues, settingsMetadata, type SettingsSchema, type Tab, type Option} from '#settings'

import {useSettings, useUpdateSettings, useRestoreDefaults} from '@/hooks/useSettings'
import {useBitcoindExitInfo} from '@/hooks/useBitcoindExitInfo'

type SettingName = keyof typeof settingsMetadata

// Trigger for each tab
function SettingsTabTrigger({value, children}: {value: string; children: React.ReactNode}) {
	const {data: exitInfo} = useBitcoindExitInfo()
	const hasCrash = exitInfo != null

	return (
		<TabsTrigger
			value={value}
			className='relative text-[12px] bg-transparent border-none data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=inactive]:text-white/60 focus-visible:outline-none focus:outline-none focus:ring-0 rounded-none hover:text-white/80 transition-none pb-3 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-transparent data-[state=active]:after:bg-white'
		>
			{children}

			{/* We show a pulsating red dot in the Advanced tab if bitcoind has crashed */}
			{value === 'advanced' && hasCrash && (
				<span className='relative inline-flex h-2 w-2'>
					{/* outer expanding ring that pings */}
					<span className='absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping' />
					{/* solid center dot */}
					<span className='relative inline-flex h-2 w-2 rounded-full bg-red-500' />
				</span>
			)}
		</TabsTrigger>
	)
}

// Content inside each tab
function SettingsTabContent({tab, form}: {tab: Tab; form: ReturnType<typeof useForm>}) {
	const fieldsForTab = (Object.keys(settingsMetadata) as SettingName[]).filter((k) => settingsMetadata[k].tab === tab)

	return (
		<>
			{fieldsForTab.map((k, index) => (
				<div key={k} className={index < fieldsForTab.length - 1 ? 'border-b-[1px] border-white/20 pb-6' : ''}>
					<FieldRenderer name={k} form={form} />
				</div>
			))}
		</>
	)
}

// Render each individual setting depending on its kind (e.g., number, toggle, multi, select)
// TODO: break out the actual field rendering into a separate function/component and make the layout DRY
function FieldRenderer({name, form}: {name: SettingName; form: ReturnType<typeof useForm>}) {
	const meta = settingsMetadata[name] as Option
	const disabled = useInputsDisabled()

	// Number fields (e.g., dbcache)
	if (meta.kind === 'number') {
		return (
			<div className='relative flex flex-col gap-1'>
				<div className='flex flex-row justify-between items-center'>
					<div>
						{form.formState.errors[name] && (
							<p className='absolute top-10 right-1 text-xs text-red-500'>
								{form.formState.errors[name]?.message as string}
							</p>
						)}
						<label className='text-[14px] font-[400] text-white'>{meta.label}</label>

						<div className='flex flex-wrap gap-1 my-1'>
							{meta.bitcoinLabel.split(',').map((label, index) => (
								<span key={index} className='text-[12px] font-[400] text-white/50 bg-[#2C2C2C] px-1 rounded-sm'>
									{label.trim()}
								</span>
							))}
						</div>
					</div>
					{/* TODO: make responsive */}
					<InputField
						className='w-32'
						id={meta.bitcoinLabel}
						type='number'
						step={meta.step ?? 1}
						{...form.register(name, {valueAsNumber: true})}
						unit={meta.unit}
						disabled={disabled}
					/>
				</div>
				<p className='text-[13px] font-[400] text-white/60'>{meta.description}</p>
				{meta.subDescription && <p className='text-[12px] font-[400] text-white/60 mt-1'>{meta.subDescription}</p>}
				<p className='text-[12px] font-[400] text-white/50  mt-2'>
					default: {meta.default} {meta.unit}
				</p>
			</div>
		)
	}

	// Boolean Toggle fields (e.g., peerblockfilters)
	if (meta.kind === 'toggle') {
		const disabledByOtherSetting =
			meta.disabledWhen && Object.entries(meta.disabledWhen).some(([other, fn]) => fn(form.watch(other as SettingName)))

		return (
			<Controller
				name={name}
				control={form.control}
				render={({field, fieldState}) => (
					<div className='flex flex-col gap-1'>
						<div className='flex flex-row justify-between items-center'>
							<div>
								<label className='text-[14px] font-[400] text-white'>{meta.label}</label>
								<div className='flex flex-wrap gap-1 my-1'>
									{meta.bitcoinLabel.split(',').map((label, index) => (
										<span key={index} className='text-[12px] font-[400] text-white/50 bg-[#2C2C2C] px-1 rounded-sm'>
											{label.trim()}
										</span>
									))}
								</div>
							</div>
							<Toggle
								name={name}
								// current RHF value
								checked={!!field.value}
								onToggle={field.onChange}
								disabled={disabled || disabledByOtherSetting}
								disabledMessage={meta.disabledMessage}
							/>
						</div>
						<p className='text-[13px] font-[400] text-white/60'>{meta.description}</p>
						{meta.subDescription && <p className='text-[12px] font-[400] text-white/60 mt-1'>{meta.subDescription}</p>}
						<p className='text-[12px] font-[400] text-white/50 mt-2'>
							default: {meta.default ? 'enabled' : 'disabled'}
						</p>
						{fieldState.error && <p className='text-xs text-red-400'>{fieldState.error.message}</p>}
					</div>
				)}
			/>
		)
	}

	// Multi-select fields (e.g., onlynet) rendered as a row of toggles
	if (meta.kind === 'multi') {
		return (
			<Controller
				name={name}
				control={form.control}
				render={({field, fieldState}) => {
					const current: string[] = field.value ?? []

					// build helpers once per render
					const isChecked = (v: string) => current.includes(v)
					const toggleValue = (v: string) => {
						const next = isChecked(v)
							? // un-check
								current.filter((x) => x !== v)
							: // check
								[...current, v]
						field.onChange(next)
					}

					return (
						<div className='flex flex-col gap-1'>
							<div className='flex flex-row justify-between items-center'>
								<div>
									<label className='text-[14px] font-[400] text-white'>{meta.label}</label>
									<div className='flex flex-wrap gap-1 my-1'>
										{meta.bitcoinLabel.split(',').map((label, index) => (
											<span key={index} className='text-[12px] font-[400] text-white/50 bg-[#2C2C2C] px-1 rounded-sm'>
												{label.trim()}
											</span>
										))}
									</div>
								</div>
								{/*  one Toggle per option  */}
								<div className='relative flex flex-col gap-2 items-end'>
									{/* validation error - TODO: move this to appropriate area */}
									{fieldState.error && (
										<p className='absolute top-20 right-0 text-xs text-red-400 text-right whitespace-nowrap'>
											{fieldState.error.message}
										</p>
									)}

									{meta.options.map((opt) => (
										<div key={opt.value} className='flex items-center gap-2'>
											<span className='text-[12px] font-[400] text-white/60'>{opt.label}</span>
											<Toggle
												name={`${name}-${opt.value}`}
												checked={isChecked(opt.value)}
												onToggle={() => toggleValue(opt.value)}
												disabled={disabled}
											/>
										</div>
									))}
								</div>
							</div>
							<p className='text-[13px] font-[400] text-white/60'>{meta.description}</p>
							<p className='text-[12px] font-[400] text-white/50 mt-2'>
								default: {meta.default.length ? meta.default.join(', ') : 'none'}
							</p>
						</div>
					)
				}}
			/>
		)
	}

	// Select fields (e.g., chain)
	// TODO: use shadcn select component and style it
	if (meta.kind === 'select') {
		return (
			<Controller
				name={name}
				control={form.control}
				render={({field}) => (
					<div className='flex flex-col gap-1'>
						<div className='flex flex-row justify-between items-center'>
							<div>
								<label className='text-[14px] font-[400] text-white'>{meta.label}</label>
								<div className='flex flex-wrap gap-1 my-1'>
									{meta.bitcoinLabel.split(',').map((label, index) => (
										<span key={index} className='text-[12px] font-[400] text-white/50 bg-[#2C2C2C] px-1 rounded-sm'>
											{label.trim()}
										</span>
									))}
								</div>
							</div>
							<Select
								value={field.value}
								defaultValue={meta.default?.toString()}
								onValueChange={field.onChange} // keeps React-Hook-Form in sync
								disabled={disabled}
							>
								<SelectTrigger className='w-[140px] rounded bg-[#272727] shadow-[inset_0_-1px_1px_0_rgba(255,255,255,0.2),_inset_0_1px_1px_0_rgba(0,0,0,0.36)] p-3 text-white focus:ring-0 ring-offset-0 border-none'>
									<SelectValue placeholder='Select…' />
								</SelectTrigger>

								<SelectContent className='bg-[#272727] shadow-[inset_0_-1px_1px_0_rgba(255,255,255,0.2),_inset_0_1px_1px_0_rgba(0,0,0,0.36)] text-white border-none'>
									{meta.options.map((option) => (
										<SelectItem key={option.value} value={option.value} className='cursor-pointer'>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<p className='text-[13px] font-[400] text-white/60'>{meta.description}</p>
						{meta.subDescription && <p className='text-[12px] font-[400] text-white/60 mt-1'>{meta.subDescription}</p>}
						<p className='text-[12px] font-[400] text-white/50 mt-2'>default: {meta.default}</p>
					</div>
				)}
			/>
		)
	}

	// If for some reason the field is not found, return null
	return null
}

// MAIN COMPONENT
export default function SettingsCard() {
	// Tab routing state
	const [searchParams, setSearchParams] = useSearchParams()
	const initialTab = searchParams.get('tab') ?? 'peers'
	const [currentTab, setCurrentTab] = useState(initialTab)

	// Form data state
	const {data: initialSettings, isLoading} = useSettings()
	const updateSettings = useUpdateSettings()
	const restoreDefaults = useRestoreDefaults()

	const form = useForm<SettingsSchema>({
		resolver: zodResolver(settingsSchema),
		mode: 'onChange',
		// initially render with default values, but we'll disable the form inputs until initial settings are available
		defaultValues,
		// keep field values/validation even when a component unmounts.
		// We're using shadcn/ui Tabs, which keep all <TabsContent>
		// mounted, so technically don't need this, but it will save us
		// if we ever refactor to conditionally render tab panels or accordins
		// that unmount their children.
		shouldUnregister: false,
	})

	// reset form with initial settings when they are available
	useEffect(() => {
		if (initialSettings) form.reset(initialSettings)
	}, [initialSettings, form])

	// Clear search if navigated here with clearSearch parameter (e.g., from "View logs" button in bitcoind crash toast)
	useEffect(() => {
		if (searchParams.get('clearSearch') === 'true') {
			setQuery('')
			// Clean up the URL by removing the clearSearch parameter
			const newParams = new URLSearchParams(searchParams)
			newParams.delete('clearSearch')
			setSearchParams(newParams, {replace: true})
		}
	}, [searchParams, setSearchParams])

	const {isDirty, isValid, isSubmitting} = form.formState

	// Disable all inputs when we're loading loading the initial settings or when the form is submitting
	const isInputsDisabled = isLoading || isSubmitting

	// These toast refs are used to clear / update the toast later without causing re-renders
	// This is so we can show a loading toast if restarting bitcoind is taking longer than X seconds, and then update it to a success or error toast without re-rendering
	const updateToastId = useRef<string | number | null>(null)
	const updateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	const onUpdateSettings = (data: SettingsSchema) => {
		// If the mutation takes longer than 1 second, we show a loading toast
		updateTimer.current = setTimeout(() => {
			updateToastId.current = toast.loading('Hang tight, Bitcoin Knots is restarting...', {duration: Infinity})
		}, 1000)

		updateSettings.mutate(data, {
			onSuccess: () => {
				clearTimeout(updateTimer.current!)
				const id = updateToastId.current
				if (id != null) {
					toast.success('Settings applied', {id, duration: 4000})
				} else {
					toast.success('Settings applied')
				}
			},
			onError: (err) => {
				clearTimeout(updateTimer.current!)
				const id = updateToastId.current
				const msg = err instanceof Error ? err.message : 'Unknown error'

				if (id != null) {
					toast.error(`Failed to save: ${msg}`, {id, duration: 4000})
				} else {
					toast.error(`Failed to save: ${msg}`)
				}
			},
			onSettled: () => {
				// Clear the toast refs for next time
				updateToastId.current = null
			},
		})
	}

	const restoreToastId = useRef<string | number | null>(null)
	const restoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	const onRestoreDefaults = () => {
		// If the mutation takes longer than 1 second, we show a loading toast
		restoreTimer.current = setTimeout(() => {
			restoreToastId.current = toast.loading('Hang tight, Bitcoin Core is restarting...', {duration: Infinity})
		}, 1000)

		restoreDefaults.mutate(undefined, {
			onSuccess: () => {
				clearTimeout(restoreTimer.current!)
				const id = restoreToastId.current
				if (id != null) {
					toast.success('Defaults restored', {id, duration: 4000})
				} else {
					toast.success('Defaults restored')
				}
			},
			onError: (err) => {
				clearTimeout(restoreTimer.current!)
				const id = restoreToastId.current
				const msg = err instanceof Error ? err.message : 'Unknown error'
				if (id != null) {
					toast.error(`Failed to restore defaults: ${msg}`, {id, duration: 4000})
				} else {
					toast.error(`Failed to restore defaults: ${msg}`)
				}
			},
			onSettled: () => {
				// Clear the toast refs for next time
				restoreToastId.current = null
			},
		})
	}

	// Search state
	const [query, setQuery] = useState('')

	// normalize once here so we don't toLowerCase inside a loop
	const search = query.trim().toLowerCase()

	// We filter settings entirely in-memory, so each key-press only
	// re-runs a cheap O(settings) array filter that isn't worth debouncing.
	const matchingFields = useMemo(() => {
		if (!search) return []
		return (Object.keys(settingsMetadata) as SettingName[]).filter((name) => {
			// search by label or bitcoinLabel
			// TODO: consider adding description as well
			const {label, bitcoinLabel} = settingsMetadata[name]
			return label.toLowerCase().includes(search) || bitcoinLabel.toLowerCase().includes(search)
		})
	}, [search])

	const isSearching = search.length > 0

	return (
		<SettingsDisabledContext.Provider value={isInputsDisabled}>
			<FormProvider {...form}>
				<Form onSubmit={onUpdateSettings}>
					<Card className='bg-card-gradient backdrop-blur-2xl border-none rounded-3xl py-4'>
						<GradientBorderFromTop />
						<CardHeader>
							<div className='flex items-center justify-between'>
								<CardTitle className='font-outfit text-white text-[20px] font-[400] pt-2'>Settings</CardTitle>
								{/* TODO: implement search */}
								<div className='relative max-w-xs mt-2'>
									<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white' />
									<Input
										value={query}
										onChange={(e) => setQuery(e.target.value)}
										placeholder='Search'
										className='pl-10 border-none bg-[#272727] shadow-[inset_0_-1px_1px_0_rgba(255,255,255,0.2),_inset_0_1px_1px_0_rgba(0,0,0,0.36)] text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/10'
									/>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<Tabs
								value={currentTab}
								onValueChange={(val: string) => {
									setCurrentTab(val)
									setSearchParams(val === 'peers' ? {} : {tab: val})
								}}
							>
								{/* TabsList */}
								<div
									className={clsx(
										'relative w-full after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-white/20',
										// hide the tabs list when searching without removing it from the DOM (prevents layout shift)
										isSearching && 'opacity-0 pointer-events-none select-none',
									)}
								>
									<FadeScrollArea className='w-full'>
										<TabsList className='relative flex bg-transparent rounded-none h-auto p-0 gap-1 z-10 w-max'>
											<SettingsTabTrigger value='peers'>Peer Settings</SettingsTabTrigger>
											<SettingsTabTrigger value='optimization'>Optimization</SettingsTabTrigger>
											<SettingsTabTrigger value='rpc-rest'>RPC and REST</SettingsTabTrigger>
											<SettingsTabTrigger value='network'>Network Selection</SettingsTabTrigger>
											<SettingsTabTrigger value='policy'>Policy</SettingsTabTrigger>
											<SettingsTabTrigger value='advanced'>Advanced</SettingsTabTrigger>
										</TabsList>
									</FadeScrollArea>
								</div>

								{/* TabsContent for each category */}
								{/* The main header height increases below md breakpoint, so we account for that here to keep the main settings card above the Dock */}
								<FadeScrollArea
									// We use a key to reset scroll position when switching tabs or search
									key={isSearching ? 'search' : currentTab}
									className='h-[calc(100dvh-425px)] md:h-[calc(100dvh-390px)] [--fade-top:hsla(0,0%,6%,1)][--fade-bottom:hsla(0,0%,3%,1)]'
								>
									{isSearching ? (
										matchingFields.length === 0 ? (
											<p className='text-white/60 text-center text-[14px] font-[400]'>No results found for "{query}"</p>
										) : (
											matchingFields.map((name, i) => (
												<div
													key={name}
													// styling to exactly match when rendered inside tabs
													className={i < matchingFields.length - 1 ? 'border-b-[1px] border-white/20 pb-6 mb-6' : ''}
												>
													<FieldRenderer name={name} form={form} />
												</div>
											))
										)
									) : (
										<>
											<TabsContent value='peers' className='space-y-6 pt-6'>
												<SettingsTabContent tab='peers' form={form} />
											</TabsContent>

											<TabsContent value='optimization' className='space-y-6 pt-6'>
												<SettingsTabContent tab='optimization' form={form} />
											</TabsContent>

											<TabsContent value='rpc-rest' className='space-y-6 pt-6'>
												<SettingsTabContent tab='rpc-rest' form={form} />
											</TabsContent>

											<TabsContent value='network' className='space-y-6 pt-6'>
												<SettingsTabContent tab='network' form={form} />
											</TabsContent>

											<TabsContent value='policy' className='space-y-6 pt-6'>
												<SettingsTabContent tab='policy' form={form} />
											</TabsContent>

											<TabsContent value='advanced' className='space-y-6 pt-6'>
												{/* TODO: determine where to place the log */}
												<DangerZoneAlert />
												<CustomConfigEditor />
												<BitcoindErrorLog />

												{/* Currently we don't have anything from settings.meta.ts that shows up in advanced. */}
												<SettingsTabContent tab='advanced' form={form} />
											</TabsContent>
										</>
									)}
								</FadeScrollArea>
							</Tabs>
							{/* )} */}
						</CardContent>
						<CardFooter className='justify-end flex gap-2'>
							{/* RESTORE DEFAULTS BUTTON */}
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										type='button'
										// We don't allow restoring defaults if the form is submitting, if the updated settings are pending, or if the restore defaults mutation is pending
										disabled={isSubmitting || updateSettings.isPending || restoreDefaults.isPending}
									>
										Restore Defaults
									</Button>
								</AlertDialogTrigger>

								<AlertDialogContent className='bg-card-gradient backdrop-blur-2xl border-white/10 border-[0.5px] rounded-2xl'>
									<AlertDialogHeader>
										<AlertDialogTitle className='font-outfit text-white text-[20px] font-[400] text-left'>
											Restore default settings?
										</AlertDialogTitle>
										<AlertDialogDescription className='text-white/60 text-left text-[13px]'>
											This will restore your current settings to the default values. You cannot undo this action. This
											will not overwrite any custom overrides you've set under the "Advanced" tab on the Settings page.
										</AlertDialogDescription>
									</AlertDialogHeader>

									<AlertDialogFooter>
										<AlertDialogCancel className='bg-white/90 hover:bg-white'>Cancel</AlertDialogCancel>
										<AlertDialogAction onClick={onRestoreDefaults} className='hover:bg-white/10'>
											Yes
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>

							{/* SAVE BUTTON */}
							<Button
								type='submit'
								// We don't allow saving if the form is not dirty (meaning it is unchanged), is invalid, if we're still loading initial settings, if the form is submitting, or if the updated settings are pending
								disabled={!isDirty || !isValid || isLoading || isSubmitting || updateSettings.isPending}
							>
								Save changes
							</Button>
						</CardFooter>
					</Card>
				</Form>
			</FormProvider>
		</SettingsDisabledContext.Provider>
	)
}
