import { describe, expect, it } from 'vitest'
import { getInvalidUrls, parseDelimitedList, toFolderName, validateFolderName } from './validation'

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
})

describe('list helpers', () => {
  it('parses comma lists and finds invalid URLs', () => {
    expect(parseDelimitedList(' a, ,b ')).toEqual(['a', 'b'])
    expect(getInvalidUrls(['https://ok.dev', 'ftp://no', 'nope'])).toEqual(['ftp://no', 'nope'])
  })
})
