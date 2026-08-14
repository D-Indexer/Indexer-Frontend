import { Navigate, Route, Routes } from 'react-router-dom'
import { routeDefinitions } from '@/app/routing'
import { appRoutes } from '@/config/routes'
import { AppLayout } from '@/layouts/AppLayout'

export const App = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {routeDefinitions.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        <Route path="*" element={<Navigate to={appRoutes.home} replace />} />
      </Route>
    </Routes>
  )
}
