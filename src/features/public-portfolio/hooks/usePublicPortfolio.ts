import { env } from '@/config/env'
import { folderData, toApiError } from '@/services'
import { stellarService } from '@/services/stellar/stellarService'
import type { Folder, PortfolioContent } from '@/types'

export type Verification =
  | { status: 'verified'; onChainCid: string; onChain: { ipfsCid: string; templateId: number; mintedAt: number } }
  | { status: 'not_minted' }
  | { status: 'unavailable'; reason: string }
  | { status: 'demo' }

export interface Divergence {
  field: 'ipfsCid' | 'templateId'
  indexed: string | number | null
  onChain: string | number
}

export interface PublicPortfolio {
  /** CID the content was loaded from: the on-chain one when the chain could be read. */
  cid: string | null
  content: PortfolioContent | null
  contentError: string | null
  /** True when the document was fetched but is not a valid portfolio (malformed content). */
  contentInvalid: boolean
  folder: Folder
  /** Fields where the indexer disagrees with the chain; rendering uses the on-chain values. */
  divergence: Divergence[]
  templateId: number | null
  verification: Verification
}

/**
 * Resolves `<name>.folder` through the indexer, checks the owner's portfolio on-chain with
 * `verify_portfolio` / `get_portfolio`, and loads the content from IPFS by the on-chain CID.
 * Returns null when the folder does not exist.
 *
 * Framework-free so the public page and `scripts/verify.ts` share one verdict.
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
  const divergence: Divergence[] = []
  let cid = indexed?.ipfsCid ?? null
  let templateId = indexed?.templateId ?? folder.templateId

  if (source.isDemo) {
    verification = { status: 'demo' }
  } else if (chainResult instanceof Error || chainResult === null) {
    verification = { status: 'unavailable', reason: chainResult ? toApiError(chainResult).message : 'Unknown error' }
  } else {
    const [isVerified, onChain] = chainResult
    if (isVerified && onChain) {
      verification = { status: 'verified', onChainCid: onChain.ipfsCid, onChain }
      if (cid !== onChain.ipfsCid) divergence.push({ field: 'ipfsCid', indexed: cid, onChain: onChain.ipfsCid })
      if (templateId !== onChain.templateId) {
        divergence.push({ field: 'templateId', indexed: templateId, onChain: onChain.templateId })
      }
      cid = onChain.ipfsCid
      templateId = onChain.templateId
      if (divergence.length > 0) console.warn(`Indexer diverges from chain for ${folderName}`, divergence)
    } else {
      verification = { status: 'not_minted' }
    }
  }

  let content: PortfolioContent | null = null
  let contentError: string | null = null
  let contentInvalid = false
  if (cid) {
    try {
      content = await source.getPortfolioContent(cid)
    } catch (error) {
      contentError = toApiError(error).message
      contentInvalid = error instanceof IpfsError && error.code === 'invalid_shape'
    }
  }

  return { cid, content, contentError, divergence, folder, templateId, verification }
}
