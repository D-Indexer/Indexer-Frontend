import { useEffect, useState } from 'react'

/** Bounded browser-side polling seam. The RPC event query is injected by the dashboard data layer. */
export const useContractEvents = (owner: string | null, poll: (() => Promise<boolean>) | undefined, intervalMs = 15_000) => {
  const [updated, setUpdated] = useState(false)
  useEffect(() => {
    if (!owner || !poll) return
    let cancelled = false
    const tick = async () => {
      if (document.visibilityState === 'hidden' || cancelled) return
      try { if (await poll()) setUpdated(true) } catch { /* retry on the next bounded interval */ }
    }
    void tick()
    const id = window.setInterval(() => void tick(), intervalMs)
    return () => { cancelled = true; window.clearInterval(id) }
  }, [owner, poll, intervalMs])
  return { updated, clearUpdate: () => setUpdated(false) }
}
