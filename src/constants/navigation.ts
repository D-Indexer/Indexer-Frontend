import { appRoutes } from '@/config/routes'

export const navigationItems = [
  { label: 'Home', href: appRoutes.home },
  { label: 'Templates', href: appRoutes.templates },
  { label: 'Create Portfolio', href: appRoutes.createPortfolio },
] as const
