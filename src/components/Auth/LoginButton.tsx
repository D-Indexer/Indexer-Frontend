import React from 'react'
import { useAuthStore } from '@/store'

export const LoginButton: React.FC = () => {
  const { isAuthenticated, logout } = useAuthStore()

  const handleLogin = async () => {
    // Passkey login logic will be implemented
    console.log('Login with Passkey')
  }

  if (isAuthenticated) {
    return (
      <button onClick={logout} className="btn btn-secondary">
        Logout
      </button>
    )
  }

  return (
    <button onClick={handleLogin} className="btn btn-primary">
      Login with Passkey
    </button>
  )
}
