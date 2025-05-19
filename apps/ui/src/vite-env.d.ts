/// <reference types="vite/client" />

declare module '*.svg?react' {
	import {FC, SVGProps} from 'react'
	const Component: FC<SVGProps<SVGSVGElement>>
	export default Component
}
