import { useState } from 'react'
import { env } from '@/config/env'
import { useAsync } from '@/hooks'
import { folderData, toApiError } from '@/services'
import { stellarService } from '@/services/stellar/stellarService'
import type { Folder, PortfolioContent } from '@/types'

export type Verification =
  | { status: 'verified'; onChainCid: string }
  | { status: 'not_minted' }
  | { status: 'unavailable'; reason: string }
  | { status: 'demo' }
  /** Content from the indexed CID is shown while the chain reads are still in flight. */
  | { status: 'verifying' }

export interface PublicPortfolio {
  /** CID the content was loaded from: the on-chain one when the chain could be read. */
  cid: string | null
  content: PortfolioContent | null
  contentError: string | null
  folder: Folder
  templateId: number | null
  verification: Verification
}

interface ContentResult {
  content: PortfolioContent | null
  contentError: string | null
}

const fetchContent = (cid: string): Promise<ContentResult> =>
  folderData.getPortfolioContent(cid).then(
    (content) => ({ content, contentError: null }),
    (error: unknown) => ({ content: null, contentError: toApiError(error).message }),
  )

/**
 * Resolves `<name>.folder` through the indexer, checks the owner's portfolio on-chain with
 * `verify_portfolio` / `get_portfolio`, and loads the content from IPFS by the on-chain CID.
 * The IPFS fetch for the indexed CID starts speculatively, in parallel with the chain reads; it is
 * only reused when the on-chain CID matches. `onProgress` receives a provisional result (marked
 * `verifying`, never `verified`) as soon as the indexed content has loaded.
 * Returns null when the folder does not exist.
 */
export const loadPublicPortfolio = async (
  folderName: string,
  onProgress?: (provisional: PublicPortfolio) => void,
): Promise<PublicPortfolio | null> => {
  const folder = await folderData.getFolderByName(folderName)
  if (!folder) return null

  const chainRead = env.demoMode
    ? Promise.resolve(null)
    : Promise.all([stellarService.verifyPortfolio(folder.owner), stellarService.getOnChainPortfolio(folder.owner)]).catch(
        (error: unknown) => error as Error,
      )

  const indexed = await folderData.getPortfolio(folder.owner)
  const indexedCid = indexed?.ipfsCid ?? null
  const speculative = indexedCid ? fetchContent(indexedCid) : null
  if (speculative && onProgress && !env.demoMode) {
    void speculative.then((result) => {
      if (!result.content) return
      onProgress({
        cid: indexedCid,
        ...result,
        folder,
        templateId: indexed?.templateId ?? folder.templateId,
        verification: { status: 'verifying' },
      })
    })
  }
  const chain = await chainRead

  let verification: Verification
  let cid = indexedCid
  let templateId = indexed?.templateId ?? folder.templateId
  if (env.demoMode) {
    verification = { status: 'demo' }
  } else if (chain instanceof Error || chain === null) {
    verification = { status: 'unavailable', reason: chain ? toApiError(chain).message : 'Unknown error' }
  } else {
    const [isVerified, onChain] = chain
    if (isVerified && onChain) {
      verification = { status: 'verified', onChainCid: onChain.ipfsCid }
      cid = onChain.ipfsCid
      templateId = onChain.templateId
    } else {
      verification = { status: 'not_minted' }
    }
  }

  // Reuse the speculative fetch only when it was for the CID we ended up with; otherwise discard it.
  const result: ContentResult = !cid ? { content: null, contentError: null } : cid === indexedCid && speculative ? await speculative : await fetchContent(cid)

  return { cid, ...result, folder, templateId, verification }
}

export const usePublicPortfolio = (folderName: string) => {
  const [provisional, setProvisional] = useState<PublicPortfolio | null>(null)
  const state = useAsync(() => {
    setProvisional(null)
    return loadPublicPortfolio(folderName, (value) => setProvisional(value))
  }, [folderName])
  const showProvisional = state.loading && provisional !== null && provisional.folder.name === folderName
  return showProvisional ? { ...state, data: provisional, loading: false } : state
}
