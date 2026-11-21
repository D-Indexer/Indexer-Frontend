import { useState } from 'react'
import { Button, Card, ErrorMessage } from '@/components/ui'
import { clearAllLocalData } from '@/services'
import { useWalletStore } from '@/store'

type ResetState =
  | { status: 'idle' }
  | { status: 'clearing' }
  | { status: 'done'; indexedDb: number; localStorage: number }
  | { status: 'error'; message: string }

/** Privacy-safe reset: clears every `folder.*` key and all IndexedDB caches on this device. */
export const SettingsPanel = () => {
  const [state, setState] = useState<ResetState>({ status: 'idle' })
  const disconnect = useWalletStore((store) => store.disconnect)

  const onClear = async () => {
    setState({ status: 'clearing' })
    try {
      const result = await clearAllLocalData()
      disconnect()
      setState({ status: 'done', ...result })
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error ? error.message : 'Could not clear local data.' })
    }
  }

  return (
    <Card className="stack">
      <div>
        <h2>Local data</h2>
        <p className="muted">
          This device stores your wallet preference and cached folder data. Clearing removes every
          <code> folder.* </code> entry and all IndexedDB caches. Your on-chain folder and portfolio are not affected.
        </p>
      </div>
      <div className="cluster">
        <Button type="button" variant="secondary" onClick={onClear} disabled={state.status === 'clearing'}>
          {state.status === 'clearing' ? 'Clearing…' : 'Clear all local data'}
        </Button>
      </div>
      {state.status === 'done' ? (
        <div className="notice notice--success" role="status">
          <p>
            Cleared {state.localStorage} stored {state.localStorage === 1 ? 'key' : 'keys'} and {state.indexedDb} IndexedDB{' '}
            {state.indexedDb === 1 ? 'cache' : 'caches'}. You may need to reconnect your wallet.
          </p>
        </div>
      ) : null}
      {state.status === 'error' ? <ErrorMessage message="Could not clear local data." detail={state.message} /> : null}
    </Card>
  )
}
