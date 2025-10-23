// This is our validation schema that is derived from the settings metadata and Bitcoin Core version.
// TODO: Consider adding a `superRefine` to handle cross-field validation.

import {z} from 'zod'
import {settingsMetadataForVersion, resolveVersion, type SelectedVersion, type Option} from './settings.meta.js'

function buildSettingsSchema(settingsMetadata: Record<string, Option>): z.ZodObject<Record<string, z.ZodTypeAny>> {
	// We prepare an (initially empty) map that will hold one Zod schema per setting key.
	const schemaMap: Record<string, z.ZodTypeAny> = {}

	// We go through every entry in settingsMetadata and build the appropriate Zod validator based on `kind`.
	for (const key of Object.keys(settingsMetadata)) {
		const meta = settingsMetadata[key] as Option
		switch (meta.kind) {
			// numbers (e.g., dbcache)
			case 'number': {
				let schema = z.number({invalid_type_error: `${meta.bitcoinLabel} must be a number`})

				// Enforce integer only when step implies integer inputs (default or integer step)
				const stepImpliesInteger = meta.step === undefined || Number.isInteger(meta.step)
				if (stepImpliesInteger) schema = schema.int(`${meta.label} must be an integer`)

				// Custom error messages for bounds
				if (meta.min !== undefined) {
					schema = schema.min(meta.min, {
						message: `Minimum ${meta.bitcoinLabel} is ${meta.min}${meta.unit ?? ''}`,
					})
				}
				if (meta.max !== undefined) {
					schema = schema.max(meta.max, {
						message: `Maximum ${meta.bitcoinLabel} is ${meta.max}${meta.unit ?? ''}`,
					})
				}
				schemaMap[key] = schema
				break
			}

			// toggles (booleans) (e.g., txindex)
			case 'toggle': {
				schemaMap[key] = z.boolean({invalid_type_error: `${meta.bitcoinLabel} must be true or false`})
				break
			}

			// multi-select (array of enums) (e.g., onlynet)
			case 'multi': {
				const values = meta.options.map((o: {value: string}) => o.value) as [string, ...string[]]
				const base = z.array(z.enum(values))
				schemaMap[key] =
					(meta.requireAtLeastOne ?? true)
						? base.nonempty({message: `${meta.bitcoinLabel}: select at least one`})
						: base
				break
			}

			// single select (e.g., network)
			case 'select': {
				schemaMap[key] = z.enum(meta.options.map((o: {value: string}) => o.value) as [string, ...string[]])
				break
			}
		}
	}
	// We allow unknown keys to pass through to avoid hard failures when switching versions mid-edit
	// TODO: look into using .strict()
	return z.object(schemaMap).passthrough()
}

// Build a version-aware schema that validates the settings against the resolved settings-metadata for the given Core version.
export function schemaForVersion(version: SelectedVersion) {
	// Resolve the desired version (can be 'latest' or a specific Bitcoin Core version) to a concrete Core version
	const bitcoinVersion = resolveVersion(version)
	const settingsMetadata = settingsMetadataForVersion(bitcoinVersion)
	return buildSettingsSchema(settingsMetadata)
}

export type SettingsSchema = z.infer<ReturnType<typeof schemaForVersion>>
