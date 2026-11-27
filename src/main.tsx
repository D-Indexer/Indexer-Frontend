import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { ConfigErrorScreen } from './app/config/ConfigErrorScreen'
import { envErrors, resourceHints } from './config/env'
import './styles/index.css'

const injectResourceHints = (hints: typeof resourceHints) => {
  const head = document.head
  for (const hint of hints) {
    if (head.querySelector(`link[rel="${hint.rel}"][href="${hint.href}"]`)) continue
    const link = document.createElement('link')
    link.rel = hint.rel
    link.href = hint.href
    if (hint.rel === 'preconnect') link.crossOrigin = 'anonymous'
    head.appendChild(link)
  }
}

injectResourceHints(resourceHints)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {envErrors.length > 0 ? (
      <ConfigErrorScreen issues={envErrors} />
    ) : (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )}
  </React.StrictMode>,
)
