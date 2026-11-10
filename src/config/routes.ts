export const appRoutes = {
  home: '/',
  dashboard: '/dashboard',
  templates: '/templates',
  publicPortfolio: '/p/:folderName',
  publicPortfolioFor: (folderName: string) => `/p/${encodeURIComponent(folderName)}`,
} as const
