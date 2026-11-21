import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { ConfigErrorScreen } from './app/config/ConfigErrorScreen'
import { envErrors, loadRuntimeConfig, parseEnv, runtimeConfigToRawEnv } from './config/env'
import './styles/index.css'

const root = ReactDOM.createRoot(document.getElementById('root')!)

const render = (issues: typeof envErrors) => {
  root.render(
    <React.StrictMode>
      {issues.length > 0 ? (
        <ConfigErrorScreen issues={issues} />
      ) : (
        <BrowserRouter>
          <App />
        </BrowserRouter>
      )}
    </React.StrictMode>,
  )
}

// The production container renders /config.json from env vars at startup; it overrides the
// build-time VITE_* values. Without it (dev server, static hosting) the build-time config is used.
void loadRuntimeConfig().then((runtime) => {
  render(runtime ? parseEnv(runtimeConfigToRawEnv(runtime)).errors : envErrors)
})
