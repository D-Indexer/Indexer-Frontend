import { describe, expect, it } from 'vitest'
import { encodeQr, qrToSvg } from './qr'

describe('encodeQr', () => {
  it('picks the smallest version and is deterministic', () => {
    const a = encodeQr('https://folder.example/p/jane.folder')
    expect(a.length).toBe(29) // 36 bytes fit version 3
    expect(encodeQr('https://folder.example/p/jane.folder')).toEqual(a)
    expect(encodeQr('hi').length).toBe(21)
  })

  it('draws finder patterns and the fixed dark module', () => {
    const m = encodeQr('hello')
    for (const [x, y] of [[0, 0], [14, 0], [0, 14]]) {
      expect(m[y][x]).toBe(true)
      expect(m[y + 3][x + 3]).toBe(true)
      expect(m[y + 1][x + 1]).toBe(false)
    }
    expect(m[m.length - 8][8]).toBe(true)
  })

  it('rejects text that does not fit', () => {
    expect(() => encodeQr('x'.repeat(300))).toThrow(RangeError)
  })
})

describe('qrToSvg', () => {
  it('produces a labelled SVG with no external references', () => {
    const svg = qrToSvg(encodeQr('hello'), 'Link <to> page')
    expect(svg).toContain('aria-label="Link to page"')
    expect(svg).not.toMatch(/https?:\/\/(?!www\.w3\.org)/)
  })
})
