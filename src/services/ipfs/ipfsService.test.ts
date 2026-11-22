import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PortfolioContent } from '@/types'
import { computeRawCidV1 } from './cid'

const post = vi.hoisted(() => vi.fn())
vi.mock('@/services/http/client', () => ({ apiClient: { post } }))
vi.mock('@/config/env', () => ({ env: { apiUrl: 'http://localhost:3000', ipfsGatewayUrl: 'https://gw.test/ipfs' } }))

const { ipfsService, isPortfolioContent, isTemplateMetadata, safeParseJson, serializePortfolioContent } = await import(
  './ipfsService'
)

const content: PortfolioContent = {
  schema_version: 1,
  folder: 'jane.folder',
  template_id: 1,
  name: 'Jane',
  headline: '',
  bio: 'Bio',
  skills: [],
  links: [],
  sections: {},
  updated_at: '2026-11-10T00:00:00.000Z',
}

/** Minimal shape axios.isAxiosError() accepts, as returned for an HTTP error response. */
const httpError = (status: number, body: unknown) =>
  Object.assign(new Error('Request failed'), { isAxiosError: true, response: { status, data: body } })

describe('ipfsService.uploadPortfolioContent', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('posts JSON as multipart "file" to the backend /upload endpoint and returns the verified CID', async () => {
    const cid = await computeRawCidV1(serializePortfolioContent(content))
    post.mockResolvedValue({ data: { cid } })

    await expect(ipfsService.uploadPortfolioContent(content)).resolves.toBe(cid)
    const [path, body] = post.mock.calls[0] as [string, FormData]
    expect(path).toBe('/upload')
    const file = body.get('file') as File
    expect(file.type).toBe('application/json')
    expect(file.name).toBe('portfolio.json')
  })

  it('rejects CIDs the contract would refuse', async () => {
    post.mockResolvedValue({ data: { cid: 'bafy_not_a_cid' } })
    await expect(ipfsService.uploadPortfolioContent(content)).rejects.toThrow('the Folder contract would reject')
  })

  it('rejects a raw CID that is not the hash of the uploaded bytes', async () => {
    post.mockResolvedValue({ data: { cid: await computeRawCidV1('something else') } })
    await expect(ipfsService.uploadPortfolioContent(content)).rejects.toThrow('does not match CID')
  })

  it('explains when the backend does not accept JSON uploads yet', async () => {
    post.mockImplementation(() => Promise.reject(httpError(400, { error: 'Unsupported file type', requestId: 'r1' })))
    await expect(ipfsService.uploadPortfolioContent(content)).rejects.toThrow('needs to allow application/json')
  })

  it('reports other backend errors', async () => {
    post.mockImplementation(() => Promise.reject(httpError(502, { error: 'IPFS node unreachable' })))
    await expect(ipfsService.uploadPortfolioContent(content)).rejects.toThrow('Upload failed: IPFS node unreachable')
  })
})

describe('ipfsService.fetchJson', () => {
  it('verifies gateway content against its CID', async () => {
    const text = '{"ok":true}'
    const cid = await computeRawCidV1(text)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(text)))
    await expect(ipfsService.fetchJson(cid)).resolves.toEqual({ ok: true })
    expect(fetch).toHaveBeenCalledWith(`https://gw.test/ipfs/${cid}`)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"tampered":true}')))
    await expect(ipfsService.fetchJson(cid)).rejects.toThrow('does not match CID')
    vi.unstubAllGlobals()
  })

  it('rejects dangerous keys and never puts them on application objects', async () => {
    const text = '{"__proto__":{"polluted":true},"ok":true}'
    const cid = await computeRawCidV1(text)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(text)))
    await expect(ipfsService.fetchJson(cid)).rejects.toMatchObject({ code: 'invalid_shape' })
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    vi.unstubAllGlobals()
  })

  it('rejects documents that fail the shape guard', async () => {
    const text = '{"schema_version":1}'
    const cid = await computeRawCidV1(text)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(text)))
    await expect(ipfsService.fetchJson(cid, isPortfolioContent)).rejects.toMatchObject({ code: 'invalid_shape' })
    vi.unstubAllGlobals()
  })
})

describe('safeParseJson', () => {
  it('returns null-prototype objects', () => {
    const value = safeParseJson('{"a":{"b":1}}') as Record<string, Record<string, number>>
    expect(Object.getPrototypeOf(value)).toBeNull()
    expect(Object.getPrototypeOf(value.a)).toBeNull()
    expect(value.a.b).toBe(1)
  })

  it.each(['__proto__', 'constructor', 'prototype'])('rejects the %s key', (key) => {
    expect(() => safeParseJson(`{"${key}":{}}`)).toThrow(/forbidden key/)
  })

  it('enforces maxDepth and maxKeys', () => {
    expect(() => safeParseJson('{"a":{"b":{"c":1}}}', { maxDepth: 2, maxKeys: 10 })).toThrow(/nested deeper/)
    expect(() => safeParseJson('{"a":1,"b":2}', { maxDepth: 5, maxKeys: 1 })).toThrow(/more than 1 keys/)
  })

  it('reports invalid JSON with a specific code', () => {
    expect(() => safeParseJson('{')).toThrow(expect.objectContaining({ code: 'invalid_json' }))
  })
})

describe('document guards', () => {
  it('accepts a valid portfolio and rejects a malformed one', () => {
    expect(isPortfolioContent(safeParseJson(serializePortfolioContent(content)))).toBe(true)
    expect(isPortfolioContent({ ...content, skills: 'nope' })).toBe(false)
    expect(isPortfolioContent(null)).toBe(false)
  })

  it('accepts valid template metadata and rejects a malformed one', () => {
    const metadata = {
      schema_version: 1,
      template_id: 1,
      name: 'Dev',
      description: 'd',
      target_industry: 'tech',
      fields: ['projects'],
    }
    expect(isTemplateMetadata(metadata)).toBe(true)
    expect(isTemplateMetadata({ ...metadata, fields: [1] })).toBe(false)
  })
})
