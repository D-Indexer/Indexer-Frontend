export const appRoutes = {
  home: '/',
  dashboard: '/dashboard',
  templates: '/templates',
  publicByAddress: '/a/:address',
  publicPortfolio: '/p/:folderName',
  publicPortfolioFor: (folderName: string) => `/p/${encodeURIComponent(folderName)}`,
} as const
