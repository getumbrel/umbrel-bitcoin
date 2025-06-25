// This is our validation schema that is derived from the settings metadata.
// TODO: Consider adding a `superRefine` to handle cross-field validation.

import {z} from 'zod'
import {settingsMetadata} from './settings.meta.js'
import type {Option} from './settings.meta.js'

// We prepare an (initially empty) map that will hold one Zod schema per setting key.
const schemaMap: Partial<Record<keyof typeof settingsMetadata, z.ZodTypeAny>> = {}

// We go through every entry in settingsMetadata and build the appropriate Zod validator based on `kind`.
for (const key of Object.keys(settingsMetadata) as Array<keyof typeof settingsMetadata>) {
	const meta = settingsMetadata[key] as Option

	switch (meta.kind) {
		// numbers (e.g., dbcache)
		case 'number': {
			let schema = z
				.number({invalid_type_error: `${meta.bitcoinLabel} must be a number`})
				.int(`${meta.label} must be an integer`)

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
		case 'toggle':
			schemaMap[key] = z.boolean({
				invalid_type_error: `${meta.bitcoinLabel} must be true or false`,
			})
			break

		// multi-select (array of enums) (e.g., onlynet)
		case 'multi': {
			const values = meta.options.map((o: {value: string}) => o.value) as [string, ...string[]]
			const base = z.array(z.enum(values))
			schemaMap[key] = (meta.requireAtLeastOne ?? true) ? base.nonempty({message: 'Select at least one'}) : base
			break
		}

		// single select (e.g., network)
		case 'select':
			schemaMap[key] = z.enum(meta.options.map((o: {value: string}) => o.value) as [string, ...string[]])
			break
	}
}

export const settingsSchema = z.object(schemaMap as Record<string, z.ZodTypeAny>)
export type SettingsSchema = z.infer<typeof settingsSchema>
