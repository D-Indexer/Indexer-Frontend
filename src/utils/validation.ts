export const isRequired = (value: string) => value.trim().length > 0

export const parseDelimitedList = (value: string) => {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const MAX_SKILLS = 20
export const MAX_SKILL_LENGTH = 50

export const normalizeSkill = (skill: string) => skill.trim().replace(/\s+/g, ' ')

export const getInvalidSkills = (skills: string[]) =>
  skills.filter((skill) => normalizeSkill(skill).length > MAX_SKILL_LENGTH).length > 0 ||
  skills.length > MAX_SKILLS

export const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const getInvalidUrls = (values: string[]) => {
  return values.filter((value) => !isHttpUrl(value))
}

export const FOLDER_SUFFIX = '.folder'
export const MAX_FOLDER_NAME_BYTES = 64
export const MIN_FOLDER_LABEL_LENGTH = 3

/** `jane` or `jane.folder` → `jane.folder`. */
export const toFolderName = (input: string) => {
  const trimmed = input.trim()
  return trimmed.endsWith(FOLDER_SUFFIX) ? trimmed : `${trimmed}${FOLDER_SUFFIX}`
}

/** Explicit UTF-8 byte length computation matching on-chain byte accounting. */
export const getByteLength = (str: string): number => new TextEncoder().encode(str).length

/**
 * Mirrors Indexer-Contract `require_valid_folder_name`: `<label>.folder`, at most 64 bytes (UTF-8),
 * label of 3+ `[a-z0-9-]` that does not start or end with `-`. Returns an error message or null.
 */
export const validateFolderName = (input: string): string | null => {
  const name = toFolderName(input)
  const label = name.slice(0, -FOLDER_SUFFIX.length)
  if (label.length === 0) return 'Enter a folder name.'
  if (label.length < MIN_FOLDER_LABEL_LENGTH) return `Use at least ${MIN_FOLDER_LABEL_LENGTH} characters before .folder.`
  if (getByteLength(name) > MAX_FOLDER_NAME_BYTES) return `The full name must be at most ${MAX_FOLDER_NAME_BYTES} characters including .folder.`
  if (!/^[a-z0-9-]+$/.test(label)) return 'Use only lowercase letters, digits and hyphens.'
  if (label.startsWith('-') || label.endsWith('-')) return 'The name cannot start or end with a hyphen.'
  return null
}
