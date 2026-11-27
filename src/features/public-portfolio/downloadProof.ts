import { ipfsService } from '@/services/ipfs/ipfsService'
import { stellarService } from '@/services/stellar/stellarService'
import { buildProofBundle, type ProofBundle } from './proofBundle'

/** Re-fetches the exact IPFS bytes and current ledger data, then assembles the bundle (network access happens here only). */
export const createProofBundle = async (args: {
  cid: string
  folder: string
  onChain: { ipfsCid: string; templateId: number; mintedAt: number }
  owner: string
}): Promise<ProofBundle> => {
  const response = await fetch(ipfsService.gatewayUrl(args.cid))
  if (!response.ok) throw new Error(`The IPFS gateway returned ${response.status} for ${args.cid}.`)
  const contentBytes = new Uint8Array(await response.arrayBuffer())
  const ledger = await stellarService.getLedgerSnapshot()
  return buildProofBundle({ ...args, contentBytes, contract: stellarService.getContractId(), ...ledger })
}

export const downloadJson = (value: unknown, filename: string) => {
  const href = URL.createObjectURL(new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.click()
  URL.revokeObjectURL(href)
}
