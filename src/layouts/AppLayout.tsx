import { Outlet } from 'react-router-dom'
import { DemoBanner } from '@/components/ui'
import { env } from '@/config/env'
import { Footer } from './Footer'
import { Header } from './Header'

export const AppLayout = () => {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {env.demoMode ? <DemoBanner /> : null}
      <Header />
      <main className="app-main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
