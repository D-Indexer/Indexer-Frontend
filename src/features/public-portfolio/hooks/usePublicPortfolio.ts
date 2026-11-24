import { env } from '@/config/env'
import { useAsync } from '@/hooks'
import { folderData, toApiError } from '@/services'
import { stellarService } from '@/services/stellar/stellarService'
import type { Folder, PortfolioContent } from '@/types'

export type Verification =
  | { status: 'verified'; onChainCid: string; mintedAt: number }
  | { status: 'not_minted' }
  | { status: 'unavailable'; reason: string }
  | { status: 'demo' }

/** Everything the "How this was verified" panel shows, so a viewer can repeat the checks without this site. */
export interface VerificationFacts {
  contractId: string
  network: string
  owner: string
  onChainCid: string | null
  templateId: number | null
  /** Unix timestamp (seconds) recorded by the contract at mint time, when known. */
  mintedAt: number | null
  /** Whether the displayed content was fetched from IPFS by the on-chain CID. */
  contentLoaded: boolean
}

export interface PublicPortfolio {
  /** CID the content was loaded from: the on-chain one when the chain could be read. */
  cid: string | null
  content: PortfolioContent | null
  contentError: string | null
  folder: Folder
  templateId: number | null
  verification: Verification
  facts: VerificationFacts
}

/**
 * Resolves `<name>.folder` through the indexer, checks the owner's portfolio on-chain with
 * `verify_portfolio` / `get_portfolio`, and loads the content from IPFS by the on-chain CID.
 * Returns null when the folder does not exist.
 */
export const loadPublicPortfolio = async (folderName: string): Promise<PublicPortfolio | null> => {
  const folder = await folderData.getFolderByName(folderName)
  if (!folder) return null

  const [indexed, chain] = await Promise.all([
    folderData.getPortfolio(folder.owner),
    env.demoMode
      ? Promise.resolve(null)
      : Promise.all([stellarService.verifyPortfolio(folder.owner), stellarService.getOnChainPortfolio(folder.owner)]).catch(
          (error: unknown) => error as Error,
        ),
  ])

  let verification: Verification
  let cid = indexed?.ipfsCid ?? null
  let templateId = indexed?.templateId ?? folder.templateId
  if (env.demoMode) {
    verification = { status: 'demo' }
  } else if (chain instanceof Error || chain === null) {
    verification = { status: 'unavailable', reason: chain ? toApiError(chain).message : 'Unknown error' }
  } else {
    const [isVerified, onChain] = chain
    if (isVerified && onChain) {
      verification = { status: 'verified', onChainCid: onChain.ipfsCid, mintedAt: onChain.mintedAt }
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
      content = await folderData.getPortfolioContent(cid)
    } catch (error) {
      contentError = toApiError(error).message
    }
  }

  const facts: VerificationFacts = {
    contractId: env.folderContractId,
    network: env.stellarNetwork,
    owner: folder.owner,
    onChainCid: verification.status === 'verified' ? verification.onChainCid : null,
    templateId: verification.status === 'verified' ? templateId : null,
    mintedAt: verification.status === 'verified' ? verification.mintedAt : null,
    contentLoaded: verification.status === 'verified' && content !== null,
  }

  return { cid, content, contentError, folder, templateId, verification, facts }
}

export const usePublicPortfolio = (folderName: string) => useAsync(() => loadPublicPortfolio(folderName), [folderName])
