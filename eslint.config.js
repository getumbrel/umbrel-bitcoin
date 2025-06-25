import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-config-prettier'

export default [
	// --------------------------------------------------
	// Base TypeScript rules – no type-aware linting here
	// --------------------------------------------------
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {sourceType: 'module'}, // ⬅️ removed project:true
		},
		plugins: {'@typescript-eslint': tseslint},
		rules: {
			...tseslint.configs.recommended.rules,
		},
	},

	// --------------------------------------------------
	// Backend – type-aware (uses its tsconfig.json)
	// --------------------------------------------------
	{
		files: ['apps/backend/**/*.{ts,tsx}'],
		languageOptions: {
			parserOptions: {
				project: ['./apps/backend/tsconfig.json'],
				tsconfigRootDir: new URL('.', import.meta.url).pathname,
			},
		},
	},

	// --------------------------------------------------
	// UI – React + type-aware (uses both tsconfigs)
	// --------------------------------------------------
	{
		files: ['apps/ui/**/*.{ts,tsx}'],
		plugins: {react, 'react-hooks': reactHooks},
		languageOptions: {
			globals: {JSX: 'readonly'},
			parserOptions: {
				project: ['./apps/ui/tsconfig.app.json', './apps/ui/tsconfig.node.json'],
				tsconfigRootDir: new URL('.', import.meta.url).pathname,
			},
		},
		rules: {
			...react.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			// stylistic rules handled by Prettier
			'react/jsx-indent': 'off',
			'react/jsx-indent-props': 'off',
			'react/jsx-closing-bracket-location': 'off',
			'react/jsx-curly-newline': 'off',

			// React 17+ JSX transform: React import no longer needed
			'react/react-in-jsx-scope': 'off',
		},
		settings: {react: {version: 'detect'}},
	},

	// --------------------------------------------------
	// Disable any rule that clashes with Prettier
	// --------------------------------------------------
	prettier,
]
