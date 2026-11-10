/**
 * Shapes returned by Indexer-Backend (docs/api.md). Timestamps are ISO strings (ledger close times).
 */

/** A claimed Folder identity (contract event `folder_cl`). */
export interface Folder {
  owner: string
  name: string
  /** Owner's selected template, null until one is chosen. */
  templateId: number | null
  claimedAt: string
  updatedAt: string
}

/** A minted portfolio NFT (`port_mint` / `port_upd` / `tmpl_set`). */
export interface Portfolio {
  owner: string
  templateId: number
  ipfsCid: string
  mintedAt: string
  updatedAt: string
}

/** A registered template (`tmpl_reg`). */
export interface Template {
  id: number
  metadataUri: string
  creator: string | null
  registeredAt: string
}

/** Template metadata JSON pinned at `metadataUri` (Indexer-Contract templates/<id>.json). */
export interface TemplateMetadata {
  schema_version: number
  template_id: number
  name: string
  description: string
  target_industry: string
  fields: string[]
}

export interface TemplateWithMetadata extends Template {
  /** Null when the metadata could not be fetched or did not match its CID. */
  metadata: TemplateMetadata | null
}

/** Portfolio document uploaded to IPFS; its CID is what `mint_portfolio` / `update_portfolio` anchor. */
export interface PortfolioContent {
  schema_version: 1
  folder: string
  template_id: number
  name: string
  headline: string
  bio: string
  skills: string[]
  links: string[]
  /** Free-text content for template-specific fields (e.g. `projects`, `case_studies`). */
  sections: Record<string, string>
  updated_at: string
}

export interface ApiError {
  message: string
  status?: number
  requestId?: string
}
