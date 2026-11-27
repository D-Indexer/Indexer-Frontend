/**
 * Minimal dependency-free QR Code encoder (byte mode, error correction level M, versions 1-10,
 * i.e. up to 213 bytes), with no React or DOM imports so it can also be used by the embed build.
 * Structure follows the public-domain-style reference algorithm described in ISO/IEC 18004.
 */

const MAX_VERSION = 10
/** Error-correction codewords per block and block counts at level M, indexed by version. */
const ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26]
const NUM_BLOCKS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5]

const getBit = (value: number, index: number) => ((value >>> index) & 1) !== 0

const sizeOf = (version: number) => version * 4 + 17

const alignmentPositions = (version: number): number[] => {
  if (version === 1) return []
  const count = Math.floor(version / 7) + 2
  const step = Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2
  const result = [6]
  for (let pos = sizeOf(version) - 7; result.length < count; pos -= step) result.splice(1, 0, pos)
  return result
}

const rawModules = (version: number) => {
  let result = (16 * version + 128) * version + 64
  if (version >= 2) {
    const count = Math.floor(version / 7) + 2
    result -= (25 * count - 10) * count - 55
    if (version >= 7) result -= 36
  }
  return result
}

const dataCodewords = (version: number) =>
  Math.floor(rawModules(version) / 8) - ECC_PER_BLOCK[version] * NUM_BLOCKS[version]

const gfMultiply = (x: number, y: number) => {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z
}

const rsDivisor = (degree: number) => {
  const result = new Array<number>(degree).fill(0)
  result[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = gfMultiply(result[j], root)
      if (j + 1 < result.length) result[j] ^= result[j + 1]
    }
    root = gfMultiply(root, 2)
  }
  return result
}

const rsRemainder = (data: number[], divisor: number[]) => {
  const result = divisor.map(() => 0)
  for (const byte of data) {
    const factor = byte ^ (result.shift() as number)
    result.push(0)
    divisor.forEach((coefficient, i) => {
      result[i] ^= gfMultiply(coefficient, factor)
    })
  }
  return result
}

const encodeData = (bytes: Uint8Array, version: number): number[] => {
  const bits: number[] = []
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1)
  }
  push(0b0100, 4)
  push(bytes.length, version < 10 ? 8 : 16)
  bytes.forEach((byte) => push(byte, 8))
  const capacityBits = dataCodewords(version) * 8
  push(0, Math.min(4, capacityBits - bits.length))
  push(0, (8 - (bits.length % 8)) % 8)
  for (let pad = 0xec; bits.length < capacityBits; pad ^= 0xec ^ 0x11) push(pad, 8)
  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) codewords.push(parseInt(bits.slice(i, i + 8).join(''), 2))
  return codewords
}

const addEccAndInterleave = (data: number[], version: number): number[] => {
  const blocks = NUM_BLOCKS[version]
  const eccLen = ECC_PER_BLOCK[version]
  const raw = Math.floor(rawModules(version) / 8)
  const shortBlocks = blocks - (raw % blocks)
  const shortLen = Math.floor(raw / blocks)
  const divisor = rsDivisor(eccLen)
  const result: number[][] = []
  for (let i = 0, k = 0; i < blocks; i++) {
    const block = data.slice(k, k + shortLen - eccLen + (i < shortBlocks ? 0 : 1))
    k += block.length
    const ecc = rsRemainder(block, divisor)
    if (i < shortBlocks) block.push(0)
    result.push(block.concat(ecc))
  }
  const out: number[] = []
  for (let i = 0; i < result[0].length; i++) {
    result.forEach((block, j) => {
      if (i !== shortLen - eccLen || j >= shortBlocks) out.push(block[i])
    })
  }
  return out
}

const maskFns: Array<(x: number, y: number) => boolean> = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
]

const penalty = (m: boolean[][]) => {
  const size = m.length
  let score = 0
  let dark = 0
  for (let a = 0; a < size; a++) {
    for (const horizontal of [true, false]) {
      let run = 1
      for (let b = 1; b <= size; b++) {
        const same = b < size && (horizontal ? m[a][b] === m[a][b - 1] : m[b][a] === m[b - 1][a])
        if (same) run++
        else {
          if (run >= 5) score += run - 2
          run = 1
        }
      }
    }
    for (let b = 0; b < size; b++) {
      if (m[a][b]) dark++
      if (a + 1 < size && b + 1 < size && m[a][b] === m[a][b + 1] && m[a][b] === m[a + 1][b] && m[a][b] === m[a + 1][b + 1]) {
        score += 3
      }
    }
  }
  const total = size * size
  return score + (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10
}

/** Encodes `text` (UTF-8) as a QR matrix; `true` is a dark module. Throws when it does not fit. */
export const encodeQr = (text: string): boolean[][] => {
  const bytes = new TextEncoder().encode(text)
  let version = 1
  while (version <= MAX_VERSION && 4 + (version < 10 ? 8 : 16) + bytes.length * 8 > dataCodewords(version) * 8) version++
  if (version > MAX_VERSION) throw new RangeError('Text is too long for the QR encoder (max 213 bytes).')

  const size = sizeOf(version)
  const modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false))
  const isFunction = Array.from({ length: size }, () => new Array<boolean>(size).fill(false))
  const setFunction = (x: number, y: number, dark: boolean) => {
    modules[y][x] = dark
    isFunction[y][x] = true
  }

  for (let i = 0; i < size; i++) {
    setFunction(6, i, i % 2 === 0)
    setFunction(i, 6, i % 2 === 0)
  }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx
        const y = cy + dy
        const dist = Math.max(Math.abs(dx), Math.abs(dy))
        if (x >= 0 && x < size && y >= 0 && y < size) setFunction(x, y, dist !== 2 && dist !== 4)
      }
    }
  }
  const positions = alignmentPositions(version)
  positions.forEach((px, i) =>
    positions.forEach((py, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === positions.length - 1) || (i === positions.length - 1 && j === 0)) return
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setFunction(px + dx, py + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
    }),
  )
  if (version >= 7) {
    let rem = version
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
    const bits = (version << 12) | rem
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3)
      const b = Math.floor(i / 3)
      setFunction(a, b, getBit(bits, i))
      setFunction(b, a, getBit(bits, i))
    }
  }

  const drawFormat = (mask: number) => {
    const data = mask // error correction level M has format bits 00
    let rem = data
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
    const bits = ((data << 10) | rem) ^ 0x5412
    for (let i = 0; i <= 5; i++) setFunction(8, i, getBit(bits, i))
    setFunction(8, 7, getBit(bits, 6))
    setFunction(8, 8, getBit(bits, 7))
    setFunction(7, 8, getBit(bits, 8))
    for (let i = 9; i < 15; i++) setFunction(14 - i, 8, getBit(bits, i))
    for (let i = 0; i < 8; i++) setFunction(size - 1 - i, 8, getBit(bits, i))
    for (let i = 8; i < 15; i++) setFunction(8, size - 15 + i, getBit(bits, i))
    setFunction(8, size - 8, true)
  }
  drawFormat(0)

  const codewords = addEccAndInterleave(encodeData(bytes, version), version)
  for (let i = 0, right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const y = ((right + 1) & 2) === 0 ? size - 1 - vert : vert
        if (!isFunction[y][x] && i < codewords.length * 8) {
          modules[y][x] = getBit(codewords[i >>> 3], 7 - (i & 7))
          i++
        }
      }
    }
  }

  const applyMask = (mask: number) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!isFunction[y][x] && maskFns[mask](x, y)) modules[y][x] = !modules[y][x]
  }
  let best = 0
  let bestScore = Infinity
  for (let mask = 0; mask < 8; mask++) {
    applyMask(mask)
    drawFormat(mask)
    const score = penalty(modules)
    if (score < bestScore) {
      best = mask
      bestScore = score
    }
    applyMask(mask)
  }
  applyMask(best)
  drawFormat(best)
  return modules
}

const QUIET_ZONE = 4

/** Renders a QR matrix as a standalone SVG string (black on white, with the 4-module quiet zone). */
export const qrToSvg = (matrix: boolean[][], label = 'QR code'): string => {
  const total = matrix.length + QUIET_ZONE * 2
  let path = ''
  matrix.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) path += `M${x + QUIET_ZONE},${y + QUIET_ZONE}h1v1h-1z`
    }),
  )
  const safeLabel = label.replace(/[&<>"]/g, '')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" role="img" aria-label="${safeLabel}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`
}

/** Draws a QR matrix onto a canvas at `scale` pixels per module (used for PNG download). */
export const drawQrToCanvas = (matrix: boolean[][], canvas: HTMLCanvasElement, scale = 8) => {
  const total = (matrix.length + QUIET_ZONE * 2) * scale
  canvas.width = total
  canvas.height = total
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not available in this browser.')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, total, total)
  context.fillStyle = '#000'
  matrix.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) context.fillRect((x + QUIET_ZONE) * scale, (y + QUIET_ZONE) * scale, scale, scale)
    }),
  )
}
