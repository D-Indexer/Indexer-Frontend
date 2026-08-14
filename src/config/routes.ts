export const appRoutes = {
  home: '/',
  dashboard: '/dashboard',
  templates: '/templates',
  createPortfolio: '/portfolios/new',
  portfolioDetail: '/portfolio/:id',
  portfolio: (id: string) => `/portfolio/${id}`,
} as const
