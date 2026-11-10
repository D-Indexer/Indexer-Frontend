/**
 * Folder contract error codes, from Indexer-Contract `src/errors.rs` (`ContractError`).
 * The contract repo has no docs/ERRORS.md; validation rules come from its docs/VALIDATION.md.
 */
export const contractErrorMessages: Record<number, { name: string; message: string }> = {
  1: { name: 'AlreadyInitialized', message: 'The Folder contract is already initialized.' },
  2: { name: 'NotInitialized', message: 'The Folder contract has not been initialized yet. Check VITE_FOLDER_CONTRACT_ID.' },
  3: { name: 'FolderNameTaken', message: 'That folder name is already taken. Try another one.' },
  4: { name: 'FolderNotFound', message: 'You need to claim a folder before you can do this.' },
  5: { name: 'PortfolioNotFound', message: 'No portfolio has been minted for this address yet. Mint one first.' },
  6: { name: 'TemplateNotFound', message: 'That template is not registered on the contract.' },
  7: { name: 'Unauthorized', message: 'Your wallet is not authorized to perform this action.' },
  8: {
    name: 'InvalidCID',
    message: 'The portfolio CID was rejected. It must be a CIDv0 (Qm…, 46 chars) or a lowercase base32 CIDv1 (ba…, 46–128 chars).',
  },
  9: {
    name: 'InvalidFolderName',
    message: 'Invalid folder name. Use 3+ lowercase letters, digits or hyphens followed by .folder (max 64 characters, no leading or trailing hyphen).',
  },
  10: { name: 'AdminAlreadyExists', message: 'That address is already an admin.' },
  11: { name: 'AdminNotFound', message: 'That address is not an admin.' },
  12: { name: 'CannotRemoveLastAdmin', message: 'The last admin cannot be removed.' },
  13: { name: 'PortfolioAlreadyMinted', message: 'You already minted a portfolio. Update it instead.' },
  14: { name: 'InvalidMetadataURI', message: 'Invalid template metadata URI. It must be ipfs://<cid>[/path].' },
  15: { name: 'TemplateAlreadyExists', message: 'A template with this ID already exists.' },
  16: { name: 'FolderAlreadyClaimed', message: 'This address already owns a folder. Each address can claim one.' },
  17: { name: 'InvalidTemplateID', message: 'Template IDs must be non-zero.' },
  18: { name: 'TemplateLimitReached', message: 'The template registry is full.' },
  19: { name: 'TooManyAdmins', message: 'The admin list is full.' },
}

/** Finds `Error(Contract, #N)` in a simulation or diagnostic message. */
export const extractContractErrorCode = (text: string): number | null => {
  const match = /Error\(Contract, #(\d+)\)/.exec(text)
  return match ? Number(match[1]) : null
}

export const describeContractError = (code: number) =>
  contractErrorMessages[code]?.message ?? `The Folder contract rejected the transaction (error #${code}).`
