/**
 * RFC 8785 JSON Canonicalization Scheme (JCS): object keys sorted by UTF-16 code units, ECMAScript
 * number and string serialisation (what `JSON.stringify` emits for primitives), no whitespace.
 */
export const canonicalizeJson = (value: unknown): string => {
  if (value === null) return 'null'
  switch (typeof value) {
    case 'boolean':
      return value ? 'true' : 'false'
    case 'number':
      if (!Number.isFinite(value)) throw new TypeError('JCS cannot serialise NaN or Infinity.')
      return JSON.stringify(Object.is(value, -0) ? 0 : value)
    case 'string':
      return JSON.stringify(value)
    case 'object': {
      if (Array.isArray(value)) {
        return `[${value.map((item) => (item === undefined ? 'null' : canonicalizeJson(item))).join(',')}]`
      }
      const record = value as Record<string, unknown>
      const members = Object.keys(record)
        .filter((key) => record[key] !== undefined)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${canonicalizeJson(record[key])}`)
      return `{${members.join(',')}}`
    }
    default:
      throw new TypeError(`JCS cannot serialise values of type ${typeof value}.`)
  }
}
