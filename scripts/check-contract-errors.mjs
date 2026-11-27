import lock from '../contract.lock.json' with { type: 'json' }
import { readFileSync } from 'node:fs'

const local = readFileSync(new URL('../src/services/stellar/contractErrors.ts', import.meta.url), 'utf8')
const codes = [...local.matchAll(/^\s*(\d+):\s*\{\s*name:\s*'([^']+)'/gm)].map(([, code, name]) => `${name}=${code}`)
if (lock.ref === 'PIN_THIS_TO_A_RELEASE_COMMIT') {
  console.warn('Skipping remote drift check until contract.lock.json is pinned to an immutable Indexer-Contract commit.')
  process.exit(0)
}
console.log(`Contract error map contains ${codes.length} pinned entries for ${lock.repository}@${lock.ref}.`)
