import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { ConfigErrorScreen } from './app/config/ConfigErrorScreen'
import { envErrors, initEnv } from './config/env'
import './styles/index.css'

const startApp = async () => {
  await initEnv()

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
}

void startApp()
