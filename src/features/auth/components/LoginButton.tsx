import { Button } from '@/components/ui'
import { stellarService } from '@/services'
import { useAuthStore } from '@/store'

export const LoginButton = () => {
  const { isAuthenticated, logout, setUser, user } = useAuthStore()

  const handleLogin = () => {
    const keypair = stellarService.createKeypair()
    setUser({
      address: keypair.publicKey(),
      portfolios: [],
    })
  }

  if (isAuthenticated) {
    return (
      <div className="cluster">
        <span className="muted">{user?.address.slice(0, 8)}…</span>
        <Button onClick={logout} variant="secondary">
          Logout
        </Button>
      </div>
    )
  }

  return <Button onClick={handleLogin}>Create demo Stellar identity</Button>
}
