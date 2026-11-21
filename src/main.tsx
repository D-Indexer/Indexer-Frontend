import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { App } from './App'
import { ConfigErrorScreen } from './app/config/ConfigErrorScreen'
import { envErrors, loadRuntimeConfig, parseEnv, runtimeConfigToRawEnv } from './config/env'
import './styles/index.css'

const root = ReactDOM.createRoot(document.getElementById('root')!)

// IPFS builds (VITE_IPFS_BUILD=true) are served from a content-addressed path with no server-side
// rewrites, so they use hash routing: every deep link resolves to the same index.html.
const Router = import.meta.env.VITE_IPFS_BUILD === 'true' ? HashRouter : BrowserRouter

const render = (issues: typeof envErrors) => {
  root.render(
    <React.StrictMode>
      {issues.length > 0 ? (
        <ConfigErrorScreen issues={issues} />
      ) : (
        <Router>
          <App />
        </Router>
      )}
    </React.StrictMode>,
  )
}

// The production container renders /config.json from env vars at startup; it overrides the
// build-time VITE_* values. Without it (dev server, static hosting) the build-time config is used.
void loadRuntimeConfig().then((runtime) => {
  render(runtime ? parseEnv(runtimeConfigToRawEnv(runtime)).errors : envErrors)
})
