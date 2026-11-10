import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface BaseProps {
  error?: string
  helpText?: string
  id: string
  label: string
  /** Static text shown after the input, e.g. `.folder`. */
  suffix?: string
}

type InputFieldProps = BaseProps & { control?: 'input' } & InputHTMLAttributes<HTMLInputElement>
type TextareaFieldProps = BaseProps & { control: 'textarea' } & TextareaHTMLAttributes<HTMLTextAreaElement>
type SelectFieldProps = BaseProps & { control: 'select'; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>

/**
 * Labelled form control with help text and an error rendered directly below it. Both are wired to
 * the control with aria-describedby, and aria-invalid is set when there is an error.
 */
export const FormField = (props: InputFieldProps | TextareaFieldProps | SelectFieldProps) => {
  const { error, helpText, id, label, suffix, required } = props
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`
  const describedBy = [error ? errorId : null, helpText ? descriptionId : null].filter(Boolean).join(' ') || undefined
  const shared = { id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined }

  let control: ReactNode
  if (props.control === 'textarea') {
    const { control: _c, error: _e, helpText: _h, label: _l, suffix: _s, ...rest } = props
    control = <textarea {...rest} {...shared} />
  } else if (props.control === 'select') {
    const { control: _c, error: _e, helpText: _h, label: _l, suffix: _s, children, ...rest } = props
    control = (
      <select {...rest} {...shared}>
        {children}
      </select>
    )
  } else {
    const { control: _c, error: _e, helpText: _h, label: _l, suffix: _s, ...rest } = props
    control = <input {...rest} {...shared} />
  }

  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required ? <span className="field__required"> (required)</span> : null}
      </label>
      {suffix ? (
        <div className="field__affix">
          {control}
          <span className="field__suffix" aria-hidden="true">
            {suffix}
          </span>
        </div>
      ) : (
        control
      )}
      {error ? (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      ) : null}
      {helpText ? (
        <p className="field__help" id={descriptionId}>
          {helpText}
        </p>
      ) : null}
    </div>
  )
}
