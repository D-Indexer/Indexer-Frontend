import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { ConfigErrorScreen } from './app/config/ConfigErrorScreen'
import { envErrors } from './config/env'
import './styles/index.css'

const render = () =>
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

// `npm run dev:mock` answers backend, IPFS and RPC calls with the MSW handlers the tests use.
if (import.meta.env.MODE === 'mock') {
  void import('./testing/msw/browser').then(({ startMockWorker }) => startMockWorker()).then(render)
} else {
  render()
}
