import { describe, expect, it } from 'vitest'
import { canonicalizeJson } from './canonicalJson'

describe('canonicalizeJson (RFC 8785)', () => {
  it('is independent of key insertion order', () => {
    expect(canonicalizeJson({ b: 1, a: { d: 2, c: 3 } })).toBe(canonicalizeJson({ a: { c: 3, d: 2 }, b: 1 }))
    expect(canonicalizeJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}')
  })

  it('sorts keys by UTF-16 code units (RFC 8785 section 3.2.3)', () => {
    const input = { '\u20ac': 'Euro', '\r': 'CR', '\ufb33': 'Hebrew', '1': 'One', '\ud83d\ude00': 'Emoji', '\u0080': 'C1', 'ö': 'o' }
    expect(Object.keys(JSON.parse(canonicalizeJson(input)) as object)).toHaveLength(7)
    expect(canonicalizeJson(input)).toBe(
      '{"\\r":"CR","1":"One","\u0080":"C1","ö":"o","\u20ac":"Euro","\ud83d\ude00":"Emoji","\ufb33":"Hebrew"}',
    )
  })

  it('serialises numbers the ES way (RFC 8785 section 3.2.2.3 vectors)', () => {
    expect(canonicalizeJson([333333333.3333333, 1e30, 4.5, 0.002, 1e-27, -0])).toBe('[333333333.3333333,1e+30,4.5,0.002,1e-27,0]')
  })

  it('matches the RFC 8785 section 3.2.4 example (numbers and literals)', () => {
    const input = { numbers: [333333333.33333329, 1e30, 4.5, 0.002, 1e-27], string: 'A\n"', literals: [null, true, false] }
    expect(canonicalizeJson(input)).toBe(
      '{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],"string":"A\\n\\""}',
    )
  })

  it('emits no insignificant whitespace and rejects non-finite numbers', () => {
    expect(canonicalizeJson({ a: [1, { b: null }] })).toBe('{"a":[1,{"b":null}]}')
    expect(() => canonicalizeJson(Number.NaN)).toThrow(TypeError)
  })
})
