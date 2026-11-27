import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import corpus from './folderNameCorpus.json'
import {
  getByteLength,
  getInvalidUrls,
  parseDelimitedList,
  toFolderName,
  validateFolderName,
} from './validation'

/**
 * Reference oracle ported directly from Indexer-Contract commit (contracts/src/validation.rs):
 * require_valid_folder_name(env, name: &String)
 */
export const rustOracleValidFolderName = (name: string): boolean => {
  const bytes = new TextEncoder().encode(name)
  if (bytes.length > 64) return false
  if (!name.endsWith('.folder')) return false
  const label = name.slice(0, -'.folder'.length)
  if (label.length < 3) return false
  if (label.startsWith('-') || label.endsWith('-')) return false
  for (let i = 0; i < label.length; i++) {
    const code = label.charCodeAt(i)
    const isLower = code >= 97 && code <= 122 // a-z
    const isDigit = code >= 48 && code <= 57 // 0-9
    const isHyphen = code === 45 // -
    if (!isLower && !isDigit && !isHyphen) return false
  }
  return true
}

describe('validateFolderName (mirrors Indexer-Contract docs/VALIDATION.md)', () => {
  it.each(['jane-doe', 'jane-doe.folder', '007', `${'a'.repeat(57)}`])('accepts %s', (name) => {
    expect(validateFolderName(name)).toBeNull()
  })

  it.each([
    ['', 'Enter a folder name.'],
    ['.folder', 'Enter a folder name.'],
    ['ab', 'Use at least 3 characters before .folder.'],
    ['-abc', 'The name cannot start or end with a hyphen.'],
    ['abc-', 'The name cannot start or end with a hyphen.'],
    ['a.b', 'Use only lowercase letters, digits and hyphens.'],
    ['Alice', 'Use only lowercase letters, digits and hyphens.'],
    ['a'.repeat(58), 'The full name must be at most 64 characters including .folder.'],
  ])('rejects "%s"', (name, message) => {
    expect(validateFolderName(name)).toBe(message)
  })

  it('appends the suffix once', () => {
    expect(toFolderName(' jane ')).toBe('jane.folder')
    expect(toFolderName('jane.folder')).toBe('jane.folder')
  })

  it('correctly reports byte vs character length for unicode', () => {
    expect(getByteLength('jane')).toBe(4)
    expect(getByteLength('café')).toBe(5)
    expect(getByteLength('🚀')).toBe(4)
  })
})

describe('Property-based tests: client validateFolderName matches Rust oracle', () => {
  it('agrees with Rust oracle for arbitrary strings with fixed seed', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const clientVerdict = validateFolderName(str) === null
        const canonical = toFolderName(str)
        const oracleVerdict = rustOracleValidFolderName(canonical)
        expect(clientVerdict).toBe(oracleVerdict)
      }),
      { seed: 42, numRuns: 1000 },
    )
  })

  it('matches all entries in the recorded edge-case corpus', () => {
    for (const item of corpus) {
      const clientVerdict = validateFolderName(item.input) === null
      expect(clientVerdict).toBe(item.expectedValid)
      expect(clientVerdict).toBe(rustOracleValidFolderName(toFolderName(item.input)))
    }
  })
})

describe('list helpers', () => {
  it('parses comma lists and finds invalid URLs', () => {
    expect(parseDelimitedList(' a, ,b ')).toEqual(['a', 'b'])
    expect(getInvalidUrls(['https://ok.dev', 'ftp://no', 'nope'])).toEqual(['ftp://no', 'nope'])
  })
})
