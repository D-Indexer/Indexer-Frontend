import type { PropsWithChildren } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { classNames } from '@/utils/classNames'

type LinkButtonVariant = 'primary' | 'secondary' | 'ghost'

interface LinkButtonProps extends LinkProps {
  variant?: LinkButtonVariant
}

export const LinkButton = ({
  children,
  className,
  variant = 'primary',
  ...props
}: PropsWithChildren<LinkButtonProps>) => {
  return (
    <Link className={classNames('button', `button--${variant}`, className)} {...props}>
      {children}
    </Link>
  )
}
