import { describe, expect, it } from 'vitest'
import { getInvalidUrls, parseDelimitedList } from './validation'

describe('list helpers', () => {
  it('parses comma lists and finds invalid URLs', () => {
    expect(parseDelimitedList(' a, ,b ')).toEqual(['a', 'b'])
    expect(getInvalidUrls(['https://ok.dev', 'ftp://no', 'nope'])).toEqual(['ftp://no', 'nope'])
  })
})
