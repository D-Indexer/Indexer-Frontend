/**
 * Deterministic, offline identicon for a contract ID.
 *
 * The contract ID is hashed with FNV-1a (32-bit) and the digest drives a 5×5 mirrored grid of
 * cells plus a hue. No network, no randomness, no canvas: the same ID always yields the same
 * cells and colour, so a user can compare the picture before signing with the one they saw
 * earlier (e.g. in the docs or a previous session).
 */

export const IDENTICON_GRID = 5

export interface ContractIdenticon {
  /** Row-major booleans, `IDENTICON_GRID * IDENTICON_GRID` entries, mirrored left/right. */
  cells: boolean[]
  /** Hue in degrees, 0–359. */
  hue: number
}

const fnv1a = (value: string): number => {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

/** Builds the identicon for `contractId`. Pure and synchronous. */
export const contractIdenticon = (contractId: string): ContractIdenticon => {
  const hash = fnv1a(contractId.trim().toUpperCase())
  const cells: boolean[] = []
  const half = Math.ceil(IDENTICON_GRID / 2)
  let bits = hash
  for (let row = 0; row < IDENTICON_GRID; row += 1) {
    const rowCells: boolean[] = []
    for (let column = 0; column < half; column += 1) {
      rowCells.push((bits & 1) === 1)
      bits = bits >>> 1
    }
    for (let column = 0; column < IDENTICON_GRID; column += 1) {
      cells.push(rowCells[Math.min(column, IDENTICON_GRID - 1 - column)])
    }
  }
  return { cells, hue: hash % 360 }
}
