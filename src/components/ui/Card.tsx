import type { HTMLAttributes, PropsWithChildren } from 'react'
import { classNames } from '@/utils/classNames'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export const Card = ({ children, className, interactive = false, ...props }: PropsWithChildren<CardProps>) => {
  return (
    <div className={classNames('card', interactive && 'card--interactive', className)} {...props}>
      {children}
    </div>
  )
}
