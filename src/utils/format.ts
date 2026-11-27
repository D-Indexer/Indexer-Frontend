export const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

/** Default cap for IPFS-sourced display strings. */
export const MAX_DISPLAY_TEXT_LENGTH = 500

/**
 * Bidi controls, zero-width and other invisible `Cf` characters that can reorder or hide text
 * (Trojan Source, homograph spoofing). Mirrors the Unicode `Cf` category plus the bidi embeddings.
 */
const INVISIBLE_CHARACTERS =
  /[\u00AD\u061C\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]/g

/**
 * Makes IPFS-sourced text safe to display: NFC-normalizes, replaces bidi/zero-width/`Cf` characters
 * with a visible placeholder, collapses control whitespace and caps the length.
 */
export const sanitizeDisplayText = (value: string, maxLength = MAX_DISPLAY_TEXT_LENGTH): string => {
  const normalized = value.normalize('NFC').replace(INVISIBLE_CHARACTERS, '\uFFFD')
  const collapsed = normalized.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  if (collapsed.length <= maxLength) return collapsed
  // Avoid splitting a surrogate pair at the cut point.
  const cut = /[\uD800-\uDBFF]/.test(collapsed.charAt(maxLength - 1)) ? maxLength - 1 : maxLength
  return `${collapsed.slice(0, cut)}…`
}

/**
 * Host to show next to a link's display text: the punycode/ASCII hostname when it differs from the
 * Unicode form, so `аpple.com` (Cyrillic) can't pass for `apple.com`. Returns null when they match.
 */
export const asciiHostname = (href: string): string | null => {
  try {
    const url = new URL(href)
    const ascii = url.host
    // `url.hostname` is already punycode when the parser had to convert it; compare against the raw input.
    const rawHost = href
      .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
      .split(/[/?#]/)[0]
      .replace(/^[^@]*@/, '')
      .replace(/:\d+$/, '')
    return rawHost.toLowerCase() === ascii.toLowerCase() ? null : ascii
  } catch {
    return null
  }
}

/** `work_history` → `Work history`. */
export const humanizeField = (field: string) => {
  const words = field.replace(/[_-]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}
