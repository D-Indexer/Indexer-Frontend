export const appRoutes = {
  home: '/',
  templates: '/templates',
  createPortfolio: '/portfolios/new',
  portfolioDetail: '/portfolio/:id',
  portfolio: (id: string) => `/portfolio/${id}`,
} as const
