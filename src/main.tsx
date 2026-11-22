import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { ConfigErrorScreen } from './app/config/ConfigErrorScreen'
import { envErrors } from './config/env'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {envErrors.length > 0 ? (
      <ConfigErrorScreen issues={envErrors} />
    ) : (
      <App />
    )}
  </React.StrictMode>,
)
