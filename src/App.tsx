import { Navigate, Route, Routes } from 'react-router-dom'
import { appRoutes } from '@/config/routes'
import { AppLayout } from '@/layouts/AppLayout'
import { CreatePortfolioPage, DashboardPage, HomePage, PortfolioPage, TemplatesPage } from '@/pages'

export const App = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={appRoutes.home} element={<HomePage />} />
        <Route path={appRoutes.dashboard} element={<DashboardPage />} />
        <Route path={appRoutes.templates} element={<TemplatesPage />} />
        <Route path={appRoutes.createPortfolio} element={<CreatePortfolioPage />} />
        <Route path={appRoutes.portfolioDetail} element={<PortfolioPage />} />
        <Route path="*" element={<Navigate to={appRoutes.home} replace />} />
      </Route>
    </Routes>
  )
}
