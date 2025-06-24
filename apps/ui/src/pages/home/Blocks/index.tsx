// Main Blocks component with 3D scene
import {Canvas} from '@react-three/fiber'
import {Scene} from './Scene.js'

export default function Blocks() {
	return (
		<div className='w-[768px] h-[180px] overflow-hidden'>
			<Canvas orthographic camera={{position: [0, 0, 8], zoom: 50}}>
				<Scene />
			</Canvas>
		</div>
	)
}
