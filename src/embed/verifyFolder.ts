import { computeRawCidV1, isRawCidV1 } from '@/services/ipfs/cid'

/** Result states of the widget. No React or DOM imports here, so it is shared by the embed and unit-testable. */
export type EmbedState =
  | { status: 'verified'; cid: string; displayName: string; owner: string }
  | { status: 'not_minted'; reason: string }
  | { status: 'error'; message: string }

export interface VerifyDeps {
  /** Resolves `<name>.folder` to its owner via the indexer; null when unclaimed. */
  getOwner: (name: string) => Promise<string | null>
  chain: {
    getOnChainPortfolio: (owner: string) => Promise<{ ipfsCid: string } | null>
    verifyPortfolio: (owner: string) => Promise<boolean>
  }
  /** Fetches the IPFS bytes for a CID. */
  fetchContent: (cid: string) => Promise<Uint8Array>
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

export const verifyFolder = async (name: string, deps: VerifyDeps): Promise<EmbedState> => {
  if (!name.trim()) return { status: 'error', message: 'Missing "name" attribute.' }
  try {
    const owner = await deps.getOwner(name)
    if (!owner) return { status: 'not_minted', reason: `${name} has not been claimed.` }

    const [verified, onChain] = await Promise.all([deps.chain.verifyPortfolio(owner), deps.chain.getOnChainPortfolio(owner)])
    if (!verified || !onChain) return { status: 'not_minted', reason: `${name} has no portfolio NFT on-chain.` }

    const bytes = await deps.fetchContent(onChain.ipfsCid)
    if (isRawCidV1(onChain.ipfsCid) && (await computeRawCidV1(bytes)) !== onChain.ipfsCid) {
      return { status: 'error', message: 'Portfolio content does not match its on-chain CID.' }
    }
    let displayName = name
    try {
      const parsed = JSON.parse(new TextDecoder().decode(bytes)) as { name?: unknown }
      if (typeof parsed.name === 'string' && parsed.name) displayName = parsed.name
    } catch {
      // Content that is not JSON still verifies by hash; fall back to the folder name.
    }
    return { status: 'verified', cid: onChain.ipfsCid, displayName, owner }
  } catch (error) {
    return { status: 'error', message: errorMessage(error) }
  }
}
