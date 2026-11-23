import { useActionState, useState } from 'react'
import { FormField } from '@/components/forms'
import { Button, Card } from '@/components/ui'
import { TxStatus, useContractTx } from '@/features/transactions'
import { useWalletGuard } from '@/features/wallet'
import { toFolderName, validateFolderName } from '@folder/validation'

interface ClaimFolderFormProps {
  onClaimed: (hash: string) => void
  owner: string
}

export const ClaimFolderForm = ({ onClaimed, owner }: ClaimFolderFormProps) => {
  const [name, setName] = useState('')
  const tx = useContractTx()
  const { blockedReason } = useWalletGuard()

  // React 19 form action: returns the submit-time validation error (undefined when the name was valid).
  const [submitError, claimAction, isPending] = useActionState<string | undefined>(async () => {
    const error = validateFolderName(name) ?? undefined
    if (error) {
      document.getElementById('folder-name')?.focus()
      return error
    }
    const result = await tx.run(owner, async () => ({ method: 'claim_folder', folderName: toFolderName(name) }))
    if (result) onClaimed(result.hash)
    return undefined
  }, undefined)
  // After a failed submit, re-validate live as the user corrects the name.
  const fieldError = submitError && (validateFolderName(name) ?? undefined)
  const busy = tx.busy || isPending

  return (
    <Card>
      <form className="form" action={claimAction} noValidate aria-labelledby="claim-title">
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
          onChange={(event) => setName(event.target.value)}
          suffix=".folder"
        />
        <TxStatus {...tx} successMessage={`Claimed ${toFolderName(name)}. It will show up here once the indexer picks it up.`} />
        <Button type="submit" disabled={busy || Boolean(blockedReason)}>
          {busy ? 'Claiming…' : 'Claim folder'}
        </Button>
      </form>
    </Card>
  )
}
