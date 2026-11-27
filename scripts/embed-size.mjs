// Reports the gzip size of the embed bundle (and fails if EMBED_MAX_GZIP_KB is set and exceeded).
import { readFileSync, appendFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const file = 'dist-embed/folder-verify.js'
const raw = readFileSync(file)
const gzipKb = gzipSync(raw).length / 1024
const line = `folder-verify.js: ${(raw.length / 1024).toFixed(1)} KB raw, ${gzipKb.toFixed(1)} KB gzip`
console.log(line)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Embed bundle size\n${line}\n`)
const max = Number(process.env.EMBED_MAX_GZIP_KB)
if (max && gzipKb > max) {
  console.error(`Embed bundle exceeds the ${max} KB gzip budget.`)
  process.exit(1)
}
