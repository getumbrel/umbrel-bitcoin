import {ShaderGradientCanvas, ShaderGradient} from '@shadergradient/react'

export default function Background() {
	// temp black background until we have a good shader gradient
	return <div className='bg-black absolute inset-0 -z-10' />
	return (
		// ShaderGradient requires style prop
		<ShaderGradientCanvas style={{position: 'absolute', inset: 0, zIndex: -1}} className='bg-black'>
			<ShaderGradient
				control='query'
				// TODO: Change this placeholder out for actual background
				// This is not calling out to shadergradient.co, it's parsing the urlString to get the equivalent config
				// urlString='https://www.shadergradient.co/customize?animate=on&axesHelper=off&bgColor1=%23000000&bgColor2=%23000000&brightness=1.2&cAzimuthAngle=180&cDistance=3.6&cPolarAngle=90&cameraZoom=1&color1=%23000000&color2=%23424242&color3=%23969696&destination=onCanvas&embedMode=off&envPreset=city&format=gif&fov=45&frameRate=10&gizmoHelper=hide&grain=on&lightType=3d&pixelDensity=1&positionX=-1.4&positionY=0&positionZ=0&range=enabled&rangeEnd=40&rangeStart=0&reflection=0.1&rotationX=0&rotationY=10&rotationZ=50&shader=defaults&type=waterPlane&uDensity=1.3&uFrequency=5.5&uSpeed=0.1&uStrength=1.7&uTime=0&wireframe=false'
				urlString='https://www.shadergradient.co/customize?animate=on&axesHelper=on&bgColor1=%23000000&bgColor2=%23000000&brightness=1.2&cAzimuthAngle=180&cDistance=2.2&cPolarAngle=95&cameraZoom=1&color1=%23000000&color2=%23424242&color3=%23969696&destination=onCanvas&embedMode=off&envPreset=city&format=gif&fov=45&frameRate=10&grain=off&lightType=3d&pixelDensity=1&positionX=0&positionY=-2.1&positionZ=0&range=enabled&rangeEnd=40&rangeStart=0&reflection=0.1&rotationX=0&rotationY=0&rotationZ=225&shader=defaults&type=waterPlane&uAmplitude=0&uDensity=1.8&uFrequency=5.5&uSpeed=0.01&uStrength=3&uTime=0.2&wireframe=false'
				// urlString='https://www.shadergradient.co/customize?animate=on&axesHelper=on&bgColor1=%23000000&bgColor2=%23000000&brightness=0.6&cAzimuthAngle=180&cDistance=2.2&cPolarAngle=95&cameraZoom=1&color1=%23000000&color2=%23424242&color3=%23969696&destination=onCanvas&embedMode=off&envPreset=city&format=gif&fov=45&frameRate=10&grain=off&lightType=3d&pixelDensity=1&positionX=1&positionY=-2.1&positionZ=0&range=enabled&rangeEnd=40&rangeStart=0&reflection=0.1&rotationX=0&rotationY=0&rotationZ=225&shader=defaults&type=waterPlane&uAmplitude=0&uDensity=1.8&uFrequency=5.5&uSpeed=0.01&uStrength=3&uTime=0.2&wireframe=false&zoomOut=false'
				// urlString='https://www.shadergradient.co/customize?animate=on&axesHelper=on&bgColor1=%23000000&bgColor2=%23000000&brightness=0.6&cAzimuthAngle=180&cDistance=2.2&cPolarAngle=95&cameraZoom=1&color1=%23000000&color2=%23424242&color3=%23969696&destination=onCanvas&embedMode=off&envPreset=city&format=gif&fov=45&frameRate=10&grain=off&lightType=3d&pixelDensity=1&positionX=2.5&positionY=1.1&positionZ=0&range=enabled&rangeEnd=40&rangeStart=0&reflection=0.1&rotationX=0&rotationY=0&rotationZ=225&shader=defaults&type=waterPlane&uAmplitude=0&uDensity=1.8&uFrequency=5.5&uSpeed=0.01&uStrength=3&uTime=0.2&wireframe=false&zoomOut=false'
			/>
		</ShaderGradientCanvas>
	)
}
