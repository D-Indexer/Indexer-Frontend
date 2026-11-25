import { env } from '@/config/env'
import { knownTemplateMetadata } from '@/data/knownTemplateMetadata'
import { apiClient } from '@/services/http/client'
import { toApiError } from '@/services/http/errors'
import type { PortfolioContent, Template, TemplateMetadata } from '@/types'
import { canonicalizeJson } from './canonicalJson'
import { cidCache } from './cidCache'
import { cidFromIpfsUri, computeRawCidV1, isRawCidV1, isValidContractCid } from './cid'

export class IpfsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IpfsError'
  }
}

const UNSUPPORTED_TYPE_HINT =
  'The backend /upload endpoint rejected the portfolio JSON ("Unsupported file type"). Indexer-Backend currently only accepts images and PDFs; it needs to allow application/json before portfolios can be published.'

/**
 * Serialises portfolio content with RFC 8785 JCS so the same content always gets the same CID,
 * regardless of key insertion order. Readers just JSON.parse, so older pretty-printed documents
 * still render; only writers changed (see docs/adr/0002-canonical-json-portfolio-documents.md).
 */
export const serializePortfolioContent = (content: PortfolioContent) => canonicalizeJson(content)

const verifyCid = async (cid: string, bytes: Uint8Array, source: string) => {
  if (isRawCidV1(cid) && (await computeRawCidV1(bytes)) !== cid) {
    throw new IpfsError(`${source} returned content that does not match CID ${cid}.`)
  }
}

export const ipfsService = {
  gatewayUrl: (cid: string) => `${env.ipfsGatewayUrl}/${cid}`,

  /**
   * Uploads portfolio JSON through Indexer-Backend `POST /upload` (the backend pins it on its IPFS
   * node; no IPFS credentials live in the browser). The returned CID must pass the contract's CID
   * rules and, for raw CIDv1, must equal the hash of the bytes we sent.
   */
  uploadPortfolioContent: async (content: PortfolioContent): Promise<string> => {
    const text = serializePortfolioContent(content)
    const bytes = new TextEncoder().encode(text)
    const form = new FormData()
    form.append('file', new Blob([bytes], { type: 'application/json' }), 'portfolio.json')

    let cid: string | undefined
    try {
      const response = await apiClient.post<{ cid?: string }>('/upload', form)
      cid = response.data.cid
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status === 400 && /unsupported file type|does not match its declared type/i.test(apiError.message)) {
        throw new IpfsError(UNSUPPORTED_TYPE_HINT)
      }
      throw new IpfsError(`Upload failed: ${apiError.message}`)
    }

    if (!cid) {
      throw new IpfsError('The backend upload response did not include a CID.')
    }
    if (!isValidContractCid(cid)) {
      throw new IpfsError(`The backend returned "${cid}", which the Folder contract would reject as an invalid CID.`)
    }
    await verifyCid(cid, bytes, 'The backend')
    return cid
  },

  /** Fetches JSON from the gateway and checks it against its CID when the CID is recomputable. */
  fetchJson: async <T>(cid: string): Promise<T> => {
    const parse = (bytes: Uint8Array): T => {
      try {
        return JSON.parse(new TextDecoder().decode(bytes)) as T
      } catch {
        throw new IpfsError(`Content at ${cid} is not valid JSON.`)
      }
    }

    // Cached bytes are only ever stored after verification; re-verify raw CIDv1 on read (cheap).
    const cached = await cidCache.get(cid)
    if (cached) {
      try {
        await verifyCid(cid, cached, 'The local cache')
        return parse(cached)
      } catch {
        /* corrupt entry: fall through to the network */
      }
    }

    let response: Response
    try {
      response = await fetch(ipfsService.gatewayUrl(cid))
    } catch {
      throw new IpfsError(`Could not reach the IPFS gateway (${env.ipfsGatewayUrl}).`)
    }
    if (!response.ok) {
      throw new IpfsError(`The IPFS gateway returned ${response.status} for ${cid}. The content may not be pinned or propagated yet.`)
    }
    const bytes = new Uint8Array(await response.arrayBuffer())
    await verifyCid(cid, bytes, 'The IPFS gateway')
    const parsed = parse(bytes)
    // Non-recomputable CIDs cannot be verified in the browser, so they are never cached.
    if (isRawCidV1(cid)) await cidCache.put(cid, bytes)
    return parsed
  },

  /**
   * Resolves a template's metadata: first from the bundled copies of the registered template files
   * (accepted only if their hash equals the on-chain CID), then from the gateway. Returns null if
   * neither works, so the UI can say so instead of inventing data.
   */
  resolveTemplateMetadata: async (template: Template): Promise<TemplateMetadata | null> => {
    const cid = cidFromIpfsUri(template.metadataUri)
    if (!cid) return null

    const bundled = knownTemplateMetadata[cid]
    if (bundled && (await computeRawCidV1(bundled)) === cid) {
      return JSON.parse(bundled) as TemplateMetadata
    }

    try {
      return await ipfsService.fetchJson<TemplateMetadata>(cid)
    } catch {
      return null
    }
  },
}
