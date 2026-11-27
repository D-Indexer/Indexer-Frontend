import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { DemoBanner, ToastContainer } from '@/components/ui'
import { env } from '@/config/env'
import { Footer } from './Footer'
import { Header } from './Header'

export const AppLayout = () => {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)

  // Move focus to the new page on client-side navigation so keyboard and screen reader users
  // start at the content instead of staying on the clicked link.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    mainRef.current?.focus()
  }, [pathname])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {isDemoMode() ? <DemoBanner /> : null}
      <Header />
      <main className="app-main" id="main-content" tabIndex={-1} ref={mainRef}>
        <Outlet />
      </main>
      <Footer />
      <ToastContainer />
    </div>
  )
}
