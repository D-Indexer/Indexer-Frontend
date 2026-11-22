import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { routes } from '@/app/routing/routeDefinitions'
import { appRoutes } from '@/config/routes'
import { AppLayout } from '@/layouts/AppLayout'

export const createAppRouter = () =>
  createBrowserRouter([
    {
      element: <AppLayout />,
      children: [
        ...routes,
        {
          path: '*',
          element: <Navigate to={appRoutes.home} replace />,
        },
      ],
    },
  ])

let routerInstance: ReturnType<typeof createAppRouter> | null = null

export const App = () => {
  routerInstance ??= createAppRouter()
  return <RouterProvider router={routerInstance} />
}
