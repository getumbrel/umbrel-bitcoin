// import {ShaderGradientCanvas, ShaderGradient} from '@shadergradient/react'

export default function Background() {
	// temp black background until we have a good shader gradient
	return <div className='bg-black absolute inset-0 -z-10' />
	// return (
	// 	<>
	// 		{/* ShaderGradient requires style prop */}
	// 		<ShaderGradientCanvas style={{position: 'absolute', inset: 0, zIndex: -2}} className='bg-black'>
	// 			<ShaderGradient
	// 				control='query'
	// 				// This is not calling out to shadergradient.co, it's parsing the urlString to get the equivalent config
	// 				urlString='https://www.shadergradient.co/customize?animate=on&axesHelper=off&bgColor1=%23000000&bgColor2=%23000000&brightness=0.9&cAzimuthAngle=180&cDistance=4.4&cPolarAngle=90&cameraZoom=1&color1=%23000000&color2=%23424242&color3=%23969696&embedMode=off&envPreset=lobby&fov=40&gizmoHelper=hide&grain=on&lightType=3d&pixelDensity=1.4&positionX=0&positionY=0&positionZ=0&range=disabled&rangeEnd=40&rangeStart=0&reflection=0.1&rotationX=0&rotationY=-10&rotationZ=50&shader=defaults&toggleAxis=true&type=plane&uDensity=2&uFrequency=5.5&uSpeed=0.03&uStrength=2.6&uTime=0&wireframe=false&zoomOut=false'
	// 			/>
	// 		</ShaderGradientCanvas>
	// 		{/* Black saturation blend layer */}
	// 		<div className='bg-black absolute inset-0 -z-1' style={{mixBlendMode: 'saturation'}} />
	// 	</>
	// )
}
