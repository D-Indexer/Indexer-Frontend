import { useAsync } from '@/hooks'
import { toApiError } from '@/services'
import { getDataSource } from '@/services/data/dataSourceFactory'
import type { Folder, PortfolioContent } from '@/types'

export type Verification =
  | { status: 'verified'; onChainCid: string }
  | { status: 'not_minted' }
  | { status: 'unavailable'; reason: string }
  | { status: 'demo' }

export interface PublicPortfolio {
  /** CID the content was loaded from: the on-chain one when the chain could be read. */
  cid: string | null
  content: PortfolioContent | null
  contentError: string | null
  folder: Folder
  templateId: number | null
  verification: Verification
}

/**
 * Resolves `<name>.folder` through the indexer, checks the owner's portfolio on-chain with
 * `verify_portfolio` / `get_portfolio`, and loads the content from IPFS by the on-chain CID.
 * Returns null when the folder does not exist.
 */
export const loadPublicPortfolio = async (folderName: string): Promise<PublicPortfolio | null> => {
  const source = getDataSource()
  const folder = await source.getFolderByName(folderName)
  if (!folder) return null

  const [indexed, chainResult] = await Promise.all([
    source.getPortfolio(folder.owner),
    source.isDemo
      ? Promise.resolve(null)
      : source.verifyPortfolio(folder.owner).catch((error: unknown) => error as Error),
  ])

  let verification: Verification
  let cid = indexed?.ipfsCid ?? null
  let templateId = indexed?.templateId ?? folder.templateId

  if (source.isDemo) {
    verification = { status: 'demo' }
  } else if (chainResult instanceof Error || chainResult === null) {
    verification = { status: 'unavailable', reason: chainResult ? toApiError(chainResult).message : 'Unknown error' }
  } else {
    const [isVerified, onChain] = chainResult
    if (isVerified && onChain) {
      verification = { status: 'verified', onChainCid: onChain.ipfsCid }
      cid = onChain.ipfsCid
      templateId = onChain.templateId
    } else {
      verification = { status: 'not_minted' }
    }
  }

  let content: PortfolioContent | null = null
  let contentError: string | null = null
  if (cid) {
    try {
      content = await source.getPortfolioContent(cid)
    } catch (error) {
      contentError = toApiError(error).message
    }
  }

  return { cid, content, contentError, folder, templateId, verification }
}

export const usePublicPortfolio = (folderName: string) => useAsync(() => loadPublicPortfolio(folderName), [folderName])
