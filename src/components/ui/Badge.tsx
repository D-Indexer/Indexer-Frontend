import type { PropsWithChildren } from 'react'
import { classNames } from '@/utils/classNames'

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger'

interface BadgeProps {
  tone?: BadgeTone
}

export const Badge = ({ children, tone = 'neutral' }: PropsWithChildren<BadgeProps>) => {
  return <span className={classNames('badge', `badge--${tone}`)}>{children}</span>
}
