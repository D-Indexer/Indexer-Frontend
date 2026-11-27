/**
 * Unified Error Catalog for Folder Frontend and Contracts.
 * Provides stable error codes (e.g. FOLDER-TX-001) with human-readable explanations,
 * actionable resolution steps, and anchors in docs/errors.md.
 */

export interface ErrorDefinition {
  code: string
  contractCode?: number
  name: string
  category: 'Contract' | 'Transaction' | 'Wallet' | 'IPFS' | 'API'
  message: string
  actionableStep: string
  docsAnchor: string
}

export const ERROR_CATALOG: Record<string, ErrorDefinition> = {
  // Contract errors (1-19)
  'FOLDER-TX-001': {
    code: 'FOLDER-TX-001',
    contractCode: 1,
    name: 'AlreadyInitialized',
    category: 'Contract',
    message: 'The Folder contract is already initialized.',
    actionableStep: 'No action needed. The contract has already been set up.',
    docsAnchor: 'folder-tx-001',
  },
  'FOLDER-TX-002': {
    code: 'FOLDER-TX-002',
    contractCode: 2,
    name: 'NotInitialized',
    category: 'Contract',
    message: 'The Folder contract has not been initialized yet. Check VITE_FOLDER_CONTRACT_ID.',
    actionableStep: 'Verify VITE_FOLDER_CONTRACT_ID points to an active initialized contract deployment.',
    docsAnchor: 'folder-tx-002',
  },
  'FOLDER-TX-003': {
    code: 'FOLDER-TX-003',
    contractCode: 3,
    name: 'FolderNameTaken',
    category: 'Contract',
    message: 'That folder name is already taken. Try another one.',
    actionableStep: 'Select a different, unclaimed folder name.',
    docsAnchor: 'folder-tx-003',
  },
  'FOLDER-TX-004': {
    code: 'FOLDER-TX-004',
    contractCode: 4,
    name: 'FolderNotFound',
    category: 'Contract',
    message: 'You need to claim a folder before you can do this.',
    actionableStep: 'Claim a .folder name for your wallet address first.',
    docsAnchor: 'folder-tx-004',
  },
  'FOLDER-TX-005': {
    code: 'FOLDER-TX-005',
    contractCode: 5,
    name: 'PortfolioNotFound',
    category: 'Contract',
    message: 'No portfolio has been minted for this address yet. Mint one first.',
    actionableStep: 'Mint your initial portfolio before attempting to update it.',
    docsAnchor: 'folder-tx-005',
  },
  'FOLDER-TX-006': {
    code: 'FOLDER-TX-006',
    contractCode: 6,
    name: 'TemplateNotFound',
    category: 'Contract',
    message: 'That template is not registered on the contract.',
    actionableStep: 'Choose a registered template from the template catalog.',
    docsAnchor: 'folder-tx-006',
  },
  'FOLDER-TX-007': {
    code: 'FOLDER-TX-007',
    contractCode: 7,
    name: 'Unauthorized',
    category: 'Contract',
    message: 'Your wallet is not authorized to perform this action.',
    actionableStep: 'Switch to the wallet address that owns the folder or has admin permissions.',
    docsAnchor: 'folder-tx-007',
  },
  'FOLDER-TX-008': {
    code: 'FOLDER-TX-008',
    contractCode: 8,
    name: 'InvalidCID',
    category: 'Contract',
    message: 'The portfolio CID was rejected. It must be a CIDv0 (Qm…, 46 chars) or a lowercase base32 CIDv1 (ba…, 46–128 chars).',
    actionableStep: 'Ensure IPFS upload produces a valid CIDv0 or CIDv1 format.',
    docsAnchor: 'folder-tx-008',
  },
  'FOLDER-TX-009': {
    code: 'FOLDER-TX-009',
    contractCode: 9,
    name: 'InvalidFolderName',
    category: 'Contract',
    message: 'Invalid folder name. Use 3+ lowercase letters, digits or hyphens followed by .folder (max 64 characters, no leading or trailing hyphen).',
    actionableStep: 'Adjust the folder name to meet naming constraints.',
    docsAnchor: 'folder-tx-009',
  },
  'FOLDER-TX-010': {
    code: 'FOLDER-TX-010',
    contractCode: 10,
    name: 'AdminAlreadyExists',
    category: 'Contract',
    message: 'That address is already an admin.',
    actionableStep: 'Verify current admin roster before adding new admins.',
    docsAnchor: 'folder-tx-010',
  },
  'FOLDER-TX-011': {
    code: 'FOLDER-TX-011',
    contractCode: 11,
    name: 'AdminNotFound',
    category: 'Contract',
    message: 'That address is not an admin.',
    actionableStep: 'Specify an existing admin address when removing admin roles.',
    docsAnchor: 'folder-tx-011',
  },
  'FOLDER-TX-012': {
    code: 'FOLDER-TX-012',
    contractCode: 12,
    name: 'CannotRemoveLastAdmin',
    category: 'Contract',
    message: 'The last admin cannot be removed.',
    actionableStep: 'Add another admin first before removing this admin.',
    docsAnchor: 'folder-tx-012',
  },
  'FOLDER-TX-013': {
    code: 'FOLDER-TX-013',
    contractCode: 13,
    name: 'PortfolioAlreadyMinted',
    category: 'Contract',
    message: 'You already minted a portfolio. Update it instead.',
    actionableStep: 'Use the update portfolio flow rather than minting again.',
    docsAnchor: 'folder-tx-013',
  },
  'FOLDER-TX-014': {
    code: 'FOLDER-TX-014',
    contractCode: 14,
    name: 'InvalidMetadataURI',
    category: 'Contract',
    message: 'Invalid template metadata URI. It must be ipfs://<cid>[/path].',
    actionableStep: 'Format metadata URI with the required ipfs:// schema.',
    docsAnchor: 'folder-tx-014',
  },
  'FOLDER-TX-015': {
    code: 'FOLDER-TX-015',
    contractCode: 15,
    name: 'TemplateAlreadyExists',
    category: 'Contract',
    message: 'A template with this ID already exists.',
    actionableStep: 'Use an unused unique ID for new templates.',
    docsAnchor: 'folder-tx-015',
  },
  'FOLDER-TX-016': {
    code: 'FOLDER-TX-016',
    contractCode: 16,
    name: 'FolderAlreadyClaimed',
    category: 'Contract',
    message: 'This address already owns a folder. Each address can claim one.',
    actionableStep: 'Each Stellar address can own only one .folder. Update your existing portfolio.',
    docsAnchor: 'folder-tx-016',
  },
  'FOLDER-TX-017': {
    code: 'FOLDER-TX-017',
    contractCode: 17,
    name: 'InvalidTemplateID',
    category: 'Contract',
    message: 'Template IDs must be non-zero.',
    actionableStep: 'Provide a valid positive non-zero integer for template ID.',
    docsAnchor: 'folder-tx-017',
  },
  'FOLDER-TX-018': {
    code: 'FOLDER-TX-018',
    contractCode: 18,
    name: 'TemplateLimitReached',
    category: 'Contract',
    message: 'The template registry is full.',
    actionableStep: 'Contact contract administrators to expand template limits.',
    docsAnchor: 'folder-tx-018',
  },
  'FOLDER-TX-019': {
    code: 'FOLDER-TX-019',
    contractCode: 19,
    name: 'TooManyAdmins',
    category: 'Contract',
    message: 'The admin list is full.',
    actionableStep: 'Cannot exceed max admin capacity.',
    docsAnchor: 'folder-tx-019',
  },

  // Stellar & Transaction errors
  'FOLDER-TX-100': {
    code: 'FOLDER-TX-100',
    name: 'SimulationFailed',
    category: 'Transaction',
    message: 'Stellar RPC simulation rejected the transaction.',
    actionableStep: 'Check transaction parameters, contract state, or account balances.',
    docsAnchor: 'folder-tx-100',
  },
  'FOLDER-TX-101': {
    code: 'FOLDER-TX-101',
    name: 'SubmissionFailed',
    category: 'Transaction',
    message: 'Failed to submit transaction to the Stellar network.',
    actionableStep: 'Check network connectivity or retry after a moment.',
    docsAnchor: 'folder-tx-101',
  },
  'FOLDER-TX-102': {
    code: 'FOLDER-TX-102',
    name: 'ConfirmationTimeout',
    category: 'Transaction',
    message: 'Transaction submission timed out waiting for ledger confirmation.',
    actionableStep: 'Check transaction hash on stellar.expert to confirm if it landed.',
    docsAnchor: 'folder-tx-102',
  },

  // Wallet errors
  'FOLDER-WALLET-001': {
    code: 'FOLDER-WALLET-001',
    name: 'WalletNotInstalled',
    category: 'Wallet',
    message: 'Freighter wallet extension is not installed.',
    actionableStep: 'Install the Freighter browser extension from freighter.app.',
    docsAnchor: 'folder-wallet-001',
  },
  'FOLDER-WALLET-002': {
    code: 'FOLDER-WALLET-002',
    name: 'UserRejected',
    category: 'Wallet',
    message: 'The transaction or connection request was declined by the user in Freighter.',
    actionableStep: 'Approve the transaction request in Freighter to proceed.',
    docsAnchor: 'folder-wallet-002',
  },
  'FOLDER-WALLET-003': {
    code: 'FOLDER-WALLET-003',
    name: 'NetworkMismatch',
    category: 'Wallet',
    message: 'Wallet network does not match the configured application network.',
    actionableStep: 'Switch Freighter network settings to Stellar Testnet.',
    docsAnchor: 'folder-wallet-003',
  },

  // IPFS errors
  'FOLDER-IPFS-001': {
    code: 'FOLDER-IPFS-001',
    name: 'FetchFailed',
    category: 'IPFS',
    message: 'Failed to fetch content from the IPFS gateway.',
    actionableStep: 'Check gateway URL configuration or retry if gateway is experiencing latency.',
    docsAnchor: 'folder-ipfs-001',
  },
  'FOLDER-IPFS-002': {
    code: 'FOLDER-IPFS-002',
    name: 'HashMismatch',
    category: 'IPFS',
    message: 'IPFS content hash does not match expected CID.',
    actionableStep: 'Verify content integrity and ensure pinning gateway serves untampered data.',
    docsAnchor: 'folder-ipfs-002',
  },

  // API errors
  'FOLDER-API-001': {
    code: 'FOLDER-API-001',
    name: 'BackendUnavailable',
    category: 'API',
    message: 'Could not reach the Folder backend service.',
    actionableStep: 'Ensure Indexer-Backend is running and VITE_API_URL is properly configured.',
    docsAnchor: 'folder-api-001',
  },
  'FOLDER-API-002': {
    code: 'FOLDER-API-002',
    name: 'NotFound',
    category: 'API',
    message: 'The requested resource was not found in the indexer.',
    actionableStep: 'Check resource identifier or verify ledger sync status.',
    docsAnchor: 'folder-api-002',
  },
}

export const getErrorByContractCode = (contractCode: number): ErrorDefinition | null => {
  const pad = String(contractCode).padStart(3, '0')
  return ERROR_CATALOG[`FOLDER-TX-${pad}`] ?? null
}

export const getErrorDefinition = (code: string): ErrorDefinition | null => {
  return ERROR_CATALOG[code] ?? null
}

export const getDocsAnchorUrl = (code: string): string => {
  const def = ERROR_CATALOG[code]
  const anchor = def ? def.docsAnchor : code.toLowerCase()
  return `/docs/errors.md#${anchor}`
}
