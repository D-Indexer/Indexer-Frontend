import { useState, type FormEvent } from 'react'
import { FormField } from '@/components/forms'
import { Button, Card } from '@/components/ui'
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
  const tx = useContractTx()
  const { blockedReason } = useWalletGuard()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const error = validateFolderName(name) ?? undefined
    setFieldError(error)
    if (error) {
      document.getElementById('folder-name')?.focus()
      return
    }
    const folderName = toFolderName(name)
    const result = await tx.run(owner, async () => ({ method: 'claim_folder', folderName }))
    if (result) onClaimed(result.hash)
  }

  return (
    <Card>
      <form className="form" onSubmit={(event) => void handleSubmit(event)} noValidate aria-labelledby="claim-title">
        <h3 id="claim-title">Claim your folder name</h3>
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
    </Card>
  )
}
