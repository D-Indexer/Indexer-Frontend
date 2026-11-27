import { useCallback, useEffect, useId, useRef, type KeyboardEvent, type PropsWithChildren, type ReactNode } from 'react'
import { classNames } from '@/utils/classNames'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

let scrollLocks = 0
let previousOverflow = ''

const lockScroll = () => {
  if (scrollLocks === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  scrollLocks += 1
}

const unlockScroll = () => {
  scrollLocks = Math.max(0, scrollLocks - 1)
  if (scrollLocks === 0) document.body.style.overflow = previousOverflow
}

const focusableIn = (element: HTMLElement | null): HTMLElement[] =>
  element ? Array.from(element.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((node) => node.offsetParent !== null) : []

interface DialogProps {
  /** Called when the user dismisses the dialog (Escape, backdrop click or the close button). */
  onClose: () => void
  open: boolean
  title: ReactNode
  description?: ReactNode
  /** Modal dialogs trap focus and lock page scroll; non-modal ones do not. */
  modal?: boolean
  /** Hide the built-in close button when the dialog renders its own actions. */
  hideCloseButton?: boolean
  className?: string
  footer?: ReactNode
}

/**
 * Accessible dialog built on the native `<dialog>` element: labelled title, focus trap,
 * focus restore, Escape handling and scroll locking for modal usage.
 */
export const Dialog = ({
  children,
  className,
  description,
  footer,
  hideCloseButton = false,
  modal = true,
  onClose,
  open,
  title,
}: PropsWithChildren<DialogProps>) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined
    if (open && !dialog.open) {
      restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      if (modal) {
        dialog.showModal()
        lockScroll()
      } else {
        dialog.show()
      }
      const [first] = focusableIn(dialog)
      ;(first ?? dialog).focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
    return undefined
  }, [modal, open])

  useEffect(() => {
    if (!open) return undefined
    return () => {
      if (modal) unlockScroll()
      restoreRef.current?.focus()
      restoreRef.current = null
    }
  }, [modal, open])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDialogElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !modal) return
      const dialog = dialogRef.current
      const focusable = focusableIn(dialog)
      if (focusable.length === 0) {
        event.preventDefault()
        dialog?.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [modal, onClose],
  )

  return (
    <dialog
      ref={dialogRef}
      className={classNames('dialog', className)}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClose={() => {
        if (open) onClose()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
    >
      <div className="dialog__panel">
        <header className="dialog__header">
          <h2 id={titleId} className="dialog__title">
            {title}
          </h2>
          {hideCloseButton ? null : (
            <button type="button" className="dialog__close" aria-label="Close dialog" onClick={onClose}>
              ×
            </button>
          )}
        </header>
        {description ? (
          <p id={descriptionId} className="dialog__description">
            {description}
          </p>
        ) : null}
        <div className="dialog__body">{children}</div>
        {footer ? <footer className="dialog__footer">{footer}</footer> : null}
      </div>
    </dialog>
  )
}
