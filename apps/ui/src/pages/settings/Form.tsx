import {useFormContext} from 'react-hook-form'

export function Form({children, ...props}: React.FormHTMLAttributes<HTMLFormElement>) {
	const methods = useFormContext()
	return (
		<form {...props} onSubmit={methods.handleSubmit(props.onSubmit as any)}>
			{children}
		</form>
	)
}

export function FormField({name, children}: {name: string; children: (field: any) => React.ReactNode}) {
	const {register, formState} = useFormContext()
	const error = (formState.errors as any)[name]?.message as string | undefined
	return children({...register(name), error})
}
