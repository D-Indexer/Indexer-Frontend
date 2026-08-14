import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

type FormFieldControl = 'input' | 'textarea'

interface FormFieldProps {
  control?: FormFieldControl
  error?: string
  helpText?: string
  id: string
  label: string
}

type InputFieldProps = FormFieldProps & InputHTMLAttributes<HTMLInputElement>
type TextareaFieldProps = FormFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>

export const FormField = ({
  control = 'input',
  error,
  helpText,
  id,
  label,
  ...props
}: InputFieldProps | TextareaFieldProps) => {
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`
  const describedBy = [helpText ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {control === 'textarea' ? (
        <textarea
          id={id}
          aria-describedby={describedBy || undefined}
          aria-invalid={Boolean(error)}
          {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={id}
          aria-describedby={describedBy || undefined}
          aria-invalid={Boolean(error)}
          {...(props as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {helpText ? (
        <p className="field__help" id={descriptionId}>
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
