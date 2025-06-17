import {useState, useEffect} from 'react'

// Hook to track global mouse position
export function useGlobalMouse() {
	const [mouse, setMouse] = useState({x: 0, y: 0})

	useEffect(() => {
		const handleMouseMove = (event: MouseEvent) => {
			if (
				event.clientX >= 0 &&
				event.clientX <= window.innerWidth &&
				event.clientY >= 0 &&
				event.clientY <= window.innerHeight
			) {
				const x = (event.clientX / window.innerWidth) * 2 - 1
				const y = -(event.clientY / window.innerHeight) * 2 + 1
				setMouse({x, y})
			} else {
				setMouse({x: 0, y: 0})
			}
		}

		const handleMouseLeave = () => setMouse({x: 0, y: 0})

		document.addEventListener('mousemove', handleMouseMove)
		document.addEventListener('mouseleave', handleMouseLeave)

		return () => {
			document.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseleave', handleMouseLeave)
		}
	}, [])

	return mouse
}
