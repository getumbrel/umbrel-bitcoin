import {useQuery} from '@tanstack/react-query'
import {api} from './lib/api'

export default function App() {
	const {data, isLoading, error} = useQuery({
		queryKey: ['hello'],
		queryFn: () => api<{message: string}>('/hello'),
		refetchInterval: 5000,
	})

	if (isLoading) return <h1>Loading…</h1>
	if (error) return <h1 style={{color: 'red'}}>Error: {(error as Error).message}</h1>

	return (
		<>
			<h1>Bitcoin Node</h1>
			<p>{data?.message}</p>
		</>
	)
}
