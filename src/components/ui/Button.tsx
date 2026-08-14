import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { classNames } from '@/utils/classNames'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export const Button = ({
  children,
  className,
  variant = 'primary',
  ...props
}: PropsWithChildren<ButtonProps>) => {
  return (
    <button className={classNames('button', `button--${variant}`, className)} {...props}>
      {children}
    </button>
  )
}
