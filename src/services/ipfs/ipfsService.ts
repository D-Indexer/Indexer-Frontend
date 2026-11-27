import { env } from '@/config/env'
import { knownTemplateMetadata } from '@/data/knownTemplateMetadata'
import { apiClient } from '@/services/http/client'
import { toApiError } from '@/services/http/errors'
import type { PortfolioContent, Template, TemplateMetadata } from '@/types'
import { canonicalizeJson } from './canonicalJson'
import { cidCache } from './cidCache'
import { cidFromIpfsUri, computeRawCidV1, isRawCidV1, isValidContractCid } from './cid'

export type IpfsErrorCode = 'too_large' | 'timeout' | 'unreachable' | 'bad_status' | 'invalid' | 'upload'

export class IpfsError extends Error {
  code: IpfsErrorCode
  constructor(message: string, code: IpfsErrorCode = 'invalid') {
    super(message)
    this.name = 'IpfsError'
    this.code = code
  }

  let keys = 0
  const walk = (value: unknown, depth: number): unknown => {
    if (value === null || typeof value !== 'object') return value
    if (depth > limits.maxDepth) {
      throw new IpfsError(`The document is nested deeper than ${limits.maxDepth} levels.`, 'invalid_shape')
    }
    if (Array.isArray(value)) return value.map((item) => walk(item, depth + 1))

    const source = value as Record<string, unknown>
    const target: Record<string, unknown> = Object.create(null) as Record<string, unknown>
    for (const key of Object.keys(source)) {
      if (DANGEROUS_KEYS.has(key)) {
        throw new IpfsError(`The document contains the forbidden key "${key}".`, 'invalid_shape')
      }
      keys += 1
      if (keys > limits.maxKeys) {
        throw new IpfsError(`The document has more than ${limits.maxKeys} keys.`, 'invalid_shape')
      }
      target[key] = walk(source[key], depth + 1)
    }
    return target
  }

  return walk(parsed, 1)
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) && Object.values(value).every((item) => typeof item === 'string')

const invalidShape = (what: string): never => {
  throw new IpfsError(`The document is not a valid ${what}.`, 'invalid_shape')
}

/** Structural guard for a portfolio document pinned to IPFS. */
export const isPortfolioContent = (value: unknown): value is PortfolioContent => {
  if (!isRecord(value)) return false
  return (
    value.schema_version === 1 &&
    typeof value.folder === 'string' &&
    typeof value.template_id === 'number' &&
    Number.isInteger(value.template_id) &&
    typeof value.name === 'string' &&
    typeof value.headline === 'string' &&
    typeof value.bio === 'string' &&
    isStringArray(value.skills) &&
    isStringArray(value.links) &&
    isStringRecord(value.sections) &&
    typeof value.updated_at === 'string'
  )
}

/** Structural guard for a template metadata document pinned at `metadataUri`. */
export const isTemplateMetadata = (value: unknown): value is TemplateMetadata => {
  if (!isRecord(value)) return false
  return (
    typeof value.schema_version === 'number' &&
    typeof value.template_id === 'number' &&
    Number.isInteger(value.template_id) &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.target_industry === 'string' &&
    isStringArray(value.fields)
  )
}

/** Parses and validates a portfolio document, throwing `IpfsError('invalid_shape')` on mismatch. */
export const parsePortfolioContent = (text: string): PortfolioContent => {
  const value = safeParseJson(text)
  if (!isPortfolioContent(value)) return invalidShape('portfolio document')
  return value
}

/** Parses and validates a template metadata document, throwing `IpfsError('invalid_shape')` on mismatch. */
export const parseTemplateMetadata = (text: string): TemplateMetadata => {
  const value = safeParseJson(text)
  if (!isTemplateMetadata(value)) return invalidShape('template metadata document')
  return value
}

/** Largest document accepted from a gateway; portfolios and template metadata are single raw blocks. */
export const MAX_PORTFOLIO_BYTES = 256 * 1024
export const GATEWAY_TIMEOUT_MS = 15_000

/** Reads a response body incrementally, aborting as soon as `maxBytes` is exceeded. */
export const readLimited = async (response: Response, maxBytes: number): Promise<Uint8Array> => {
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBytes) {
    void response.body?.cancel().catch(() => undefined)
    throw new IpfsError(`The content is larger than the ${Math.round(maxBytes / 1024)} KiB limit.`, 'too_large')
  }
  if (!response.body) {
    const buffer = new Uint8Array(await response.arrayBuffer())
    if (buffer.byteLength > maxBytes) throw new IpfsError(`The content is larger than the ${Math.round(maxBytes / 1024)} KiB limit.`, 'too_large')
    return buffer
  }
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      void reader.cancel().catch(() => undefined)
      throw new IpfsError(`The content is larger than the ${Math.round(maxBytes / 1024)} KiB limit.`, 'too_large')
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

const UNSUPPORTED_TYPE_HINT =
  'The backend /upload endpoint rejected the portfolio JSON ("Unsupported file type"). Indexer-Backend currently only accepts images and PDFs; it needs to allow application/json before portfolios can be published.'

/**
 * Serialises portfolio content with RFC 8785 JCS so the same content always gets the same CID,
 * regardless of key insertion order. Readers just JSON.parse, so older pretty-printed documents
 * still render; only writers changed (see docs/adr/0002-canonical-json-portfolio-documents.md).
 */
export const serializePortfolioContent = (content: PortfolioContent) => canonicalizeJson(content)

export type ContentVerification = 'hash-verified' | 'unverified'
const verifyCid = async (cid: string, bytes: Uint8Array, source: string): Promise<ContentVerification> => {
  if (isRawCidV1(cid) && (await computeRawCidV1(bytes)) !== cid) {
    throw new IpfsError(`${source} returned content that does not match CID ${cid}.`)
  }
  return isRawCidV1(cid) ? 'hash-verified' : 'unverified'
}

/** Raw CIDv1 the backend would return for this content; lets callers detect "unchanged" before uploading. */
export const computePortfolioCid = (content: PortfolioContent) => computeRawCidV1(serializePortfolioContent(content))

export const ipfsService = {
  gatewayUrl: (cid: string) => `${env.ipfsGatewayUrl}/${cid}`,

  /**
   * Uploads portfolio JSON through Indexer-Backend `POST /upload` (the backend pins it on its IPFS
   * node; no IPFS credentials live in the browser). The returned CID must pass the contract's CID
   * rules and, for raw CIDv1, must equal the hash of the bytes we sent.
   *
   * Sequence diagrams (mint, update, public verification) with trust boundaries:
   * `docs/architecture.md#flows`.
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
      throw new IpfsError(`Upload failed: ${apiError.message}`, 'upload')
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
  fetchJson: async <T>(cid: string, options: { signal?: AbortSignal; timeoutMs?: number; maxBytes?: number } = {}): Promise<T> => {
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

    const timeoutSignal = AbortSignal.timeout(options.timeoutMs ?? GATEWAY_TIMEOUT_MS)
    const signal = options.signal ? AbortSignal.any([options.signal, timeoutSignal]) : timeoutSignal
    const timeoutError = () =>
      new IpfsError(`The IPFS gateway (${env.ipfsGatewayUrl}) took too long to respond. Try again in a moment.`, 'timeout')

    let response: Response
    try {
      response = await fetch(ipfsService.gatewayUrl(cid), { signal })
    } catch {
      if (timeoutSignal.aborted) throw timeoutError()
      throw new IpfsError(`Could not reach the IPFS gateway (${env.ipfsGatewayUrl}).`, 'unreachable')
    }
    if (!response.ok) {
      throw new IpfsError(`The IPFS gateway returned ${response.status} for ${cid}. The content may not be pinned or propagated yet.`, 'bad_status')
    }
    let bytes: Uint8Array
    try {
      bytes = await readLimited(response, options.maxBytes ?? MAX_PORTFOLIO_BYTES)
    } catch (error) {
      if (error instanceof IpfsError) throw error
      if (timeoutSignal.aborted) throw timeoutError()
      throw new IpfsError(`The download from the IPFS gateway was interrupted.`, 'unreachable')
    }
    await verifyCid(cid, bytes, 'The IPFS gateway')
    const parsed = parse(bytes)
    // Non-recomputable CIDs cannot be verified in the browser, so they are never cached.
    if (isRawCidV1(cid)) await cidCache.put(cid, bytes)
    return parsed
  },

  /** Backwards-compatible JSON reader; callers needing UI disclosure use fetchJsonWithVerification. */
  fetchJson: async <T>(cid: string): Promise<T> => (await ipfsService.fetchJsonWithVerification<T>(cid)).value,

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
      try {
        return parseTemplateMetadata(bundled)
      } catch {
        return null
      }
    }

    try {
      return await ipfsService.fetchJson<TemplateMetadata>(cid, isTemplateMetadata)
    } catch {
      return null
    }
  },
}
