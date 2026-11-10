import { TESTNET_PASSPHRASE } from '@/services/stellar/network'
import { useWalletStore } from '@/store'
import type { Folder, Portfolio, TemplateWithMetadata } from '@/types'

export const OWNER = 'GAPAMTTVHB7RZ5DQHEINZN3GQYRCXXWNCQNQSY5YAU6RKQUYX2QJT2CM'
export const CID_V1 = 'bafkreie33ewzcjvpo3gldpvqgevtoy4oaygkqri3cwxqr6o6lsqc4jqvwu'
export const CID_V2 = 'bafkreifwfa7v77kn2om36djjtqiwqykldpady3ytsfbqkqgcrfilhjqtnu'
export const TX_HASH = '3f659a4283badbb3ee509652b8fbb1ebf0c80124b02a0485f6695f830f94dc40'

export const buildFolder = (overrides: Partial<Folder> = {}): Folder => ({
  owner: OWNER,
  name: 'jane.folder',
  templateId: null,
  claimedAt: '2026-11-09T22:22:27.000Z',
  updatedAt: '2026-11-09T22:22:27.000Z',
  ...overrides,
})

export const buildPortfolio = (overrides: Partial<Portfolio> = {}): Portfolio => ({
  owner: OWNER,
  templateId: 1,
  ipfsCid: CID_V1,
  mintedAt: '2026-11-09T22:23:07.000Z',
  updatedAt: '2026-11-09T22:23:52.000Z',
  ...overrides,
})

export const developerTemplate: TemplateWithMetadata = {
  id: 1,
  metadataUri: 'ipfs://bafkreiejxg6d3gqvi3737mcwxkv4u7gismaraxgv5zfoqtfuc3nbdgve7i',
  creator: null,
  registeredAt: '2026-11-09T22:14:42.000Z',
  metadata: {
    schema_version: 1,
    template_id: 1,
    name: 'Developer',
    description: 'Clean single-page layout for software engineers.',
    target_industry: 'Software Engineering',
    fields: ['bio', 'github', 'skills', 'projects', 'work_history'],
  },
}

export const connectTestnetWallet = () =>
  useWalletStore.setState({ address: OWNER, network: 'TESTNET', networkPassphrase: TESTNET_PASSPHRASE, status: 'connected', error: null })
