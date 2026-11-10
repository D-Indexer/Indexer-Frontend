import { appRoutes } from '@/config/routes'

export const navigationItems = [
  { label: 'Home', href: appRoutes.home },
  { label: 'My Folder', href: appRoutes.dashboard },
  { label: 'Templates', href: appRoutes.templates },
] as const
