import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FormField } from '@/components/forms'
import { Button, Card } from '@/components/ui'
import { TxStatus, useContractTx } from '@/features/transactions'
import { useWalletGuard } from '@/features/wallet'
import { folderData, stellarService } from '@/services'
import { TransactionError } from '@/services/stellar/stellarService'
import { toFolderName, validateFolderName } from '@/utils/validation'

interface ClaimFolderFormProps {
  onClaimed: (hash: string) => void
  owner: string
}

interface FolderNameAvailability {
  folderName: string
  owner: string
  status: 'idle' | 'checking' | 'available' | 'taken' | 'error'
  message?: string
}

export const ClaimFolderForm = ({ onClaimed, owner }: ClaimFolderFormProps) => {
  const [name, setName] = useState('')
  const [search] = useSearchParams()
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [availability, setAvailability] = useState<FolderNameAvailability>({ folderName: '', owner: '', status: 'idle' })
  const lookupInFlight = useRef<Promise<void> | null>(null)
  const tx = useContractTx()
  const { blockedReason } = useWalletGuard()
  const folderName = toFolderName(name)
  const hasValidName = !validateFolderName(name)
  const availabilityMatchesName = availability.folderName === folderName && availability.owner === owner
  const isAvailable = availabilityMatchesName && availability.status === 'available'

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    if (validateFolderName(name) || blockedReason) {
      setAvailability({ folderName, owner, status: 'idle' })
      return () => {
        active = false
        controller.abort()
      }
    }

    setAvailability({ folderName, owner, status: 'checking', message: 'Checking folder name availability…' })
    const timer = window.setTimeout(() => {
      const startLookup = async () => {
        if (lookupInFlight.current) await lookupInFlight.current
        if (!active) return

        const lookup = (async () => {
          try {
            const existing = await folderData.getFolderByName(folderName, controller.signal)
            if (!active || controller.signal.aborted) return
            if (existing) {
              setAvailability({
                folderName,
                owner,
                status: 'taken',
                message: 'This folder name is already claimed.',
              })
              return
            }

            await stellarService.simulateClaimFolder(owner, folderName)
            if (active) {
              setAvailability({ folderName, owner, status: 'available', message: 'This folder name is available.' })
            }
          } catch (error) {
            if (!active || controller.signal.aborted) return
            if (error instanceof TransactionError && error.options.contractErrorCode === 3) {
              setAvailability({
                folderName,
                owner,
                status: 'taken',
                message: 'This folder name is already claimed.',
              })
              return
            }
            setAvailability({
              folderName,
              owner,
              status: 'error',
              message: `Could not check availability: ${error instanceof Error ? error.message : String(error)}`,
            })
          }
        })()
        lookupInFlight.current = lookup
        await lookup
        if (lookupInFlight.current === lookup) lookupInFlight.current = null
      }

      void startLookup()
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [blockedReason, folderName, name, owner])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const error = validateFolderName(name) ?? undefined
    setFieldError(error)
    if (error) {
      document.getElementById('folder-name')?.focus()
      return
    }
    if (!isAvailable) return
    const result = await tx.run(owner, async () => ({ method: 'claim_folder', folderName }))
    if (result) onClaimed(result.hash)
  }

  const availabilityMessage = availabilityMatchesName ? availability.message : undefined

  return (
    <Card>
      <form className="form" onSubmit={(event) => void handleSubmit(event)} noValidate aria-labelledby="claim-title">
        <h2 id="claim-title" className="form__title">Claim your folder name</h2>
        <FormField
          id="folder-name"
          label="Folder name"
          helpText="3–57 lowercase letters, digits or hyphens. “.folder” is added for you. One folder per address."
          error={fieldError}
          value={name || search.get('claim') || ''}
          autoComplete="off"
          spellCheck={false}
          required
          onChange={(event) => {
            setName(event.target.value)
            if (fieldError) setFieldError(validateFolderName(event.target.value) ?? undefined)
          }}
          suffix=".folder"
        />
        {availabilityMessage ? (
          <div className={`folder-availability folder-availability--${availability.status}`} role="status" aria-live="polite">
            {availabilityMessage}
            {availability.status === 'taken' ? (
              <>
                {' '}
                <a href={`/p/${encodeURIComponent(availability.folderName)}`}>View public page</a>
              </>
            ) : null}
          </div>
        ) : null}
        <TxStatus {...tx} successMessage={`Claimed ${toFolderName(name)}. It will show up here once the indexer picks it up.`} />
        <Button type="submit" disabled={tx.busy || Boolean(blockedReason) || (hasValidName && !isAvailable)}>
          {tx.busy ? 'Claiming…' : 'Claim folder'}
        </Button>
      </form>
    </Card>
  )
}
