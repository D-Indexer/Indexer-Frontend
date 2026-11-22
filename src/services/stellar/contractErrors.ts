import { getErrorByContractCode } from '@/services/errors/catalog'

/**
 * Folder contract error codes, from Indexer-Contract `src/errors.rs` (`ContractError`).
 * The contract repo has no docs/ERRORS.md; validation rules come from its docs/VALIDATION.md.
 */
export const contractErrorMessages: Record<number, { code: string; message: string; name: string }> = {
  1: { code: 'FOLDER-TX-001', name: 'AlreadyInitialized', message: 'The Folder contract is already initialized.' },
  2: { code: 'FOLDER-TX-002', name: 'NotInitialized', message: 'The Folder contract has not been initialized yet. Check VITE_FOLDER_CONTRACT_ID.' },
  3: { code: 'FOLDER-TX-003', name: 'FolderNameTaken', message: 'That folder name is already taken. Try another one.' },
  4: { code: 'FOLDER-TX-004', name: 'FolderNotFound', message: 'You need to claim a folder before you can do this.' },
  5: { code: 'FOLDER-TX-005', name: 'PortfolioNotFound', message: 'No portfolio has been minted for this address yet. Mint one first.' },
  6: { code: 'FOLDER-TX-006', name: 'TemplateNotFound', message: 'That template is not registered on the contract.' },
  7: { code: 'FOLDER-TX-007', name: 'Unauthorized', message: 'Your wallet is not authorized to perform this action.' },
  8: {
    code: 'FOLDER-TX-008',
    name: 'InvalidCID',
    message: 'The portfolio CID was rejected. It must be a CIDv0 (Qm…, 46 chars) or a lowercase base32 CIDv1 (ba…, 46–128 chars).',
  },
  9: {
    code: 'FOLDER-TX-009',
    name: 'InvalidFolderName',
    message: 'Invalid folder name. Use 3+ lowercase letters, digits or hyphens followed by .folder (max 64 characters, no leading or trailing hyphen).',
  },
  10: { code: 'FOLDER-TX-010', name: 'AdminAlreadyExists', message: 'That address is already an admin.' },
  11: { code: 'FOLDER-TX-011', name: 'AdminNotFound', message: 'That address is not an admin.' },
  12: { code: 'FOLDER-TX-012', name: 'CannotRemoveLastAdmin', message: 'The last admin cannot be removed.' },
  13: { code: 'FOLDER-TX-013', name: 'PortfolioAlreadyMinted', message: 'You already minted a portfolio. Update it instead.' },
  14: { code: 'FOLDER-TX-014', name: 'InvalidMetadataURI', message: 'Invalid template metadata URI. It must be ipfs://<cid>[/path].' },
  15: { code: 'FOLDER-TX-015', name: 'TemplateAlreadyExists', message: 'A template with this ID already exists.' },
  16: { code: 'FOLDER-TX-016', name: 'FolderAlreadyClaimed', message: 'This address already owns a folder. Each address can claim one.' },
  17: { code: 'FOLDER-TX-017', name: 'InvalidTemplateID', message: 'Template IDs must be non-zero.' },
  18: { code: 'FOLDER-TX-018', name: 'TemplateLimitReached', message: 'The template registry is full.' },
  19: { code: 'FOLDER-TX-019', name: 'TooManyAdmins', message: 'The admin list is full.' },
}

/** Finds `Error(Contract, #N)` in a simulation or diagnostic message. */
export const extractContractErrorCode = (text: string): number | null => {
  const match = /Error\(Contract, #(\d+)\)/.exec(text)
  return match ? Number(match[1]) : null
}

export const getContractErrorCodeString = (code: number): string | undefined => {
  return contractErrorMessages[code]?.code ?? getErrorByContractCode(code)?.code
}

export const describeContractError = (code: number) =>
  contractErrorMessages[code]?.message ?? `The Folder contract rejected the transaction (error #${code}).`
