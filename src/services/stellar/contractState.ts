export interface OnChainPortfolioState {
  ipfsCid: string
  templateId: number
  mintedAt: number
  liveUntilLedgerSeq?: number
}

export type ContractIdentity = { status: 'unchecked' | 'match' | 'mismatch' | 'unavailable'; deployedWasmHash?: string }

let identity: ContractIdentity = { status: 'unchecked' }
export const contractIdentity = {
  get: () => identity,
  set: (next: ContractIdentity) => { identity = next },
  clear: () => { identity = { status: 'unchecked' } },
}

/** Maps only known Folder event symbols; unknown contract events remain safely ignored. */
export type FolderEvent =
  | { type: 'folder_claimed'; folderName: string }
  | { type: 'portfolio_minted'; ipfsCid: string; templateId: number }
  | { type: 'portfolio_updated'; ipfsCid: string }

export const decodeFolderEvent = (topic: string, data: Record<string, unknown>): FolderEvent | null => {
  if (topic === 'folder_cl' && typeof data.folderName === 'string') return { type: 'folder_claimed', folderName: data.folderName }
  if (topic === 'port_mint' && typeof data.ipfsCid === 'string' && typeof data.templateId === 'number') return { type: 'portfolio_minted', ipfsCid: data.ipfsCid, templateId: data.templateId }
  if (topic === 'port_upd' && typeof data.ipfsCid === 'string') return { type: 'portfolio_updated', ipfsCid: data.ipfsCid }
  return null
}
