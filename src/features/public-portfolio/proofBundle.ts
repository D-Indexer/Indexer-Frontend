import pkg from '../../../package.json'
import { computeRawCidV1, isRawCidV1 } from '@/services/ipfs/cid'
import { TESTNET_PASSPHRASE } from '@/services/stellar/network'

export const PROOF_BUNDLE_VERSION = 1

/** Self-describing proof that a portfolio's content matches the CID anchored on-chain. See docs/proof-bundle.md. */
export interface ProofBundle {
  version: typeof PROOF_BUNDLE_VERSION
  appVersion: string
  fetchedAt: string
  folder: string
  owner: string
  contract: string
  networkPassphrase: string
  cid: string
  /** The exact IPFS bytes of the portfolio content, base64. */
  contentBase64: string
  liveUntilLedger: number | null
  latestLedger: number
  /** What the contract simulations returned when the bundle was made. */
  rpcResponse: { verify_portfolio: boolean; get_portfolio: { ipfsCid: string; templateId: number; mintedAt: number } }
}

export interface ProofInput {
  contentBytes: Uint8Array
  contract: string
  cid: string
  fetchedAt?: Date
  folder: string
  latestLedger: number
  liveUntilLedger: number | null
  onChain: { ipfsCid: string; templateId: number; mintedAt: number }
  owner: string
}

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

const base64ToBytes = (value: string): Uint8Array => Uint8Array.from(atob(value), (char) => char.charCodeAt(0))

export const buildProofBundle = (input: ProofInput): ProofBundle => ({
  version: PROOF_BUNDLE_VERSION,
  appVersion: pkg.version,
  fetchedAt: (input.fetchedAt ?? new Date()).toISOString(),
  folder: input.folder,
  owner: input.owner,
  contract: input.contract,
  networkPassphrase: TESTNET_PASSPHRASE,
  cid: input.cid,
  contentBase64: bytesToBase64(input.contentBytes),
  liveUntilLedger: input.liveUntilLedger,
  latestLedger: input.latestLedger,
  rpcResponse: { verify_portfolio: true, get_portfolio: input.onChain },
})

export interface ProofResult {
  errors: string[]
  valid: boolean
}

/**
 * Offline check of a bundle: supported version, shape, and that the embedded content hashes to the
 * CID the contract reported. It does not query the network; re-check the contract separately.
 */
export const verifyProofBundle = async (bundle: unknown): Promise<ProofResult> => {
  const errors: string[] = []
  const b = bundle as Partial<ProofBundle> | null
  if (!b || typeof b !== 'object') return { valid: false, errors: ['Bundle is not an object.'] }
  if (b.version !== PROOF_BUNDLE_VERSION) return { valid: false, errors: [`Unsupported bundle version: ${String(b.version)}.`] }
  for (const key of ['folder', 'owner', 'contract', 'networkPassphrase', 'cid', 'contentBase64', 'fetchedAt'] as const) {
    if (typeof b[key] !== 'string' || b[key] === '') errors.push(`Missing field: ${key}.`)
  }
  if (typeof b.latestLedger !== 'number') errors.push('Missing field: latestLedger.')
  if (b.rpcResponse?.verify_portfolio !== true) errors.push('The recorded verify_portfolio response is not true.')
  if (errors.length > 0) return { valid: false, errors }

  if (b.rpcResponse?.get_portfolio?.ipfsCid !== b.cid) errors.push('The CID does not match the recorded get_portfolio response.')
  if (!isRawCidV1(b.cid as string)) {
    errors.push('The CID is not a raw CIDv1 (bafkrei...), so it cannot be recomputed locally.')
  } else {
    try {
      if ((await computeRawCidV1(base64ToBytes(b.contentBase64 as string))) !== b.cid) errors.push('The content does not hash to the CID.')
    } catch {
      errors.push('The content is not valid base64.')
    }
  }
  return { valid: errors.length === 0, errors }
}
