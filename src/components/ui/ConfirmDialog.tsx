import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Button } from './Button'
import { Dialog } from './Dialog'

export interface ConfirmOptions {
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Style the confirm button as destructive. */
  destructive?: boolean
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

export interface ConfirmDialogController {
  /** Opens the dialog and resolves `true` when confirmed, `false` when dismissed. */
  confirm: (options: ConfirmOptions) => Promise<boolean>
  dialog: ReactNode
}

/** Promise-based confirmation dialog: `const ok = await confirm({ title: 'Delete?' })`. */
export const useConfirmDialog = (): ConfirmDialogController => {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const pendingRef = useRef<PendingConfirm | null>(null)

  const settle = useCallback((confirmed: boolean) => {
    const current = pendingRef.current
    pendingRef.current = null
    setPending(null)
    current?.resolve(confirmed)
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    pendingRef.current?.resolve(false)
    return new Promise<boolean>((resolve) => {
      const next = { ...options, resolve }
      pendingRef.current = next
      setPending(next)
    })
  }, [])

  const dialog = (
    <Dialog
      open={pending !== null}
      title={pending?.title ?? ''}
      description={pending?.description}
      onClose={() => settle(false)}
      hideCloseButton
      footer={
        <>
          <Button variant="secondary" onClick={() => settle(false)}>
            {pending?.cancelLabel ?? 'Cancel'}
          </Button>
          <Button variant={pending?.destructive ? 'danger' : 'primary'} onClick={() => settle(true)}>
            {pending?.confirmLabel ?? 'Confirm'}
          </Button>
        </>
      }
    />
  )

  return { confirm, dialog }
}
