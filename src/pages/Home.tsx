import React from 'react'
import { LoginButton, TemplateList } from '@/components'
import { useAuthStore } from '@/store'

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="home">
      <header>
        <h1>🏗️ Folder</h1>
        <LoginButton />
      </header>
      <main>
        {isAuthenticated ? (
          <TemplateList />
        ) : (
          <div className="hero">
            <h2>Create Your Dynamic Portfolio</h2>
            <p>Build, verify, and monetize your professional identity on Stellar</p>
          </div>
        )}
      </main>
    </div>
  )
}
