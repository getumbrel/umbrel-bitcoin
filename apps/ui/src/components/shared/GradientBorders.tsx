// TODO: tailwindify these and create different ones based on Suj's figma designs
// tailwind v4 now support radial gradients
// Also, use proper gradients and colours
export function GradientBorderFromTop() {
	return (
		<span
			aria-hidden
			style={{
				position: 'absolute',
				inset: 0,
				padding: 1,
				borderRadius: 'inherit',
				background: 'linear-gradient(180deg, #313131 0%, rgba(49, 49, 49, 0) 100%)',
				mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
				WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
				maskComposite: 'exclude',
				WebkitMaskComposite: 'xor',
				pointerEvents: 'none',
			}}
		/>
	)
}

export function GradientBorderTopBottom({depth = '5%'}: {depth?: string}) {
	return (
		<span
			aria-hidden
			style={{
				position: 'absolute',
				inset: 0,
				padding: 1,
				borderRadius: 'inherit',

				/* two layers, each `depth` tall, no side glow */
				background: `
          linear-gradient(180deg, #313131 0%, rgba(49,49,49,0) 100%) top    / 100% ${depth} no-repeat,
          linear-gradient(  0deg, #313131 0%, rgba(49,49,49,0) 100%) bottom / 100% ${depth} no-repeat
        `,

				/* punch-out so only the outer strip shows */
				mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
				WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
				maskComposite: 'exclude',
				WebkitMaskComposite: 'xor',

				pointerEvents: 'none',
			}}
		/>
	)
}

export function GradientBorderFromCorners() {
	return (
		<span
			aria-hidden
			style={{
				position: 'absolute',
				inset: 0,
				padding: 1,
				borderRadius: 'inherit',
				background:
					'radial-gradient(at top left, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 40%), radial-gradient(at bottom right, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 70%)',
				mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
				WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
				maskComposite: 'exclude',
				WebkitMaskComposite: 'xor',
				pointerEvents: 'none',
			}}
		/>
	)
}
