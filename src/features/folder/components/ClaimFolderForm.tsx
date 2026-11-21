import { useState, type FormEvent } from 'react'
import { FormField } from '@/components/forms'
import { Button, Card, Dialog, useConfirmDialog } from '@/components/ui'
import { TxStatus, useContractTx } from '@/features/transactions'
import { useWalletGuard } from '@/features/wallet'
import { toFolderName, validateFolderName } from '@/utils/validation'

interface ClaimFolderFormProps {
  onClaimed: (hash: string) => void
  owner: string
}

export const ClaimFolderForm = ({ onClaimed, owner }: ClaimFolderFormProps) => {
  const [name, setName] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [reviewOpen, setReviewOpen] = useState(false)
  const confirmDialog = useConfirmDialog()
  const tx = useContractTx()
  const { blockedReason } = useWalletGuard()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const error = validateFolderName(name) ?? undefined
    setFieldError(error)
    if (error) {
      document.getElementById('folder-name')?.focus()
      return
    }
    setReviewOpen(true)
  }

  const handleConfirm = async () => {
    const folderName = toFolderName(name)
    const confirmed = await confirmDialog.confirm({
      title: `Claim ${folderName}?`,
      description: 'This name is registered to your address on Stellar testnet and cannot be changed later.',
      confirmLabel: 'Claim folder',
    })
    if (!confirmed) return
    setReviewOpen(false)
    const result = await tx.run(owner, async () => ({ method: 'claim_folder', folderName }))
    if (result) onClaimed(result.hash)
  }

  return (
    <Card>
      <form className="form" onSubmit={handleSubmit} noValidate aria-labelledby="claim-title">
        <h2 id="claim-title" className="form__title">Claim your folder name</h2>
        <FormField
          id="folder-name"
          label="Folder name"
          helpText="3–57 lowercase letters, digits or hyphens. “.folder” is added for you. One folder per address."
          error={fieldError}
          value={name}
          autoComplete="off"
          spellCheck={false}
          required
          onChange={(event) => {
            setName(event.target.value)
            if (fieldError) setFieldError(validateFolderName(event.target.value) ?? undefined)
          }}
          suffix=".folder"
        />
        <TxStatus {...tx} successMessage={`Claimed ${toFolderName(name)}. It will show up here once the indexer picks it up.`} />
        <Button type="submit" disabled={tx.busy || Boolean(blockedReason)}>
          {tx.busy ? 'Claiming…' : 'Claim folder'}
        </Button>
      </form>
      <Dialog
        open={reviewOpen}
        title="Review your folder claim"
        description="Check the name before signing. The transaction is submitted to Stellar testnet."
        onClose={() => setReviewOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewOpen(false)}>
              Back
            </Button>
            <Button onClick={() => void handleConfirm()} disabled={tx.busy || Boolean(blockedReason)}>
              Continue
            </Button>
          </>
        }
      >
        <p>
          Folder name: <strong className="mono">{toFolderName(name)}</strong>
        </p>
        <p className="muted">Owner: {owner}</p>
      </Dialog>
      {confirmDialog.dialog}
    </Card>
  )
}
