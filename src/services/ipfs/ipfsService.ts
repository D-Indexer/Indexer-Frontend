import { env } from '@/config/env'
import { knownTemplateMetadata } from '@/data/knownTemplateMetadata'
import { apiClient } from '@/services/http/client'
import { toApiError } from '@/services/http/errors'
import type { PortfolioContent, Template, TemplateMetadata } from '@/types'
import { cidFromIpfsUri, computeRawCidV1, isRawCidV1, isValidContractCid } from './cid'

export type IpfsErrorCode = 'invalid_json' | 'invalid_shape'

export class IpfsError extends Error {
  readonly code?: IpfsErrorCode

  constructor(message: string, code?: IpfsErrorCode) {
    super(message)
    this.name = 'IpfsError'
    this.code = code
  }
}

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export interface SafeParseLimits {
  /** Maximum nesting depth of arrays/objects (the root document is depth 1). */
  maxDepth: number
  /** Maximum number of keys across all objects in the document. */
  maxKeys: number
}

export const SAFE_PARSE_LIMITS: SafeParseLimits = { maxDepth: 16, maxKeys: 1000 }

/**
 * Parses untrusted JSON without ever handing dangerous keys to application objects: `__proto__`,
 * `constructor` and `prototype` are rejected outright, objects are rebuilt with a null prototype,
 * and depth/key counts are bounded so a hostile document cannot exhaust the tab.
 */
export const safeParseJson = (text: string, limits: SafeParseLimits = SAFE_PARSE_LIMITS): unknown => {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new IpfsError('The document is not valid JSON.', 'invalid_json')
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

const UNSUPPORTED_TYPE_HINT =
  'The backend /upload endpoint rejected the portfolio JSON ("Unsupported file type"). Indexer-Backend currently only accepts images and PDFs; it needs to allow application/json before portfolios can be published.'

/** Serialises portfolio content deterministically so the same content always gets the same CID. */
export const serializePortfolioContent = (content: PortfolioContent) => `${JSON.stringify(content, null, 2)}\n`

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

  /**
   * Fetches JSON from the gateway and checks it against its CID when the CID is recomputable.
   * The body is parsed with `safeParseJson`; pass a guard to also validate its shape.
   */
  fetchJson: async <T>(cid: string, guard?: (value: unknown) => value is T): Promise<T> => {
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
    const value = safeParseJson(new TextDecoder().decode(bytes))
    if (guard && !guard(value)) {
      throw new IpfsError(`Content at ${cid} does not match the expected document shape.`, 'invalid_shape')
    }
    return value as T
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
