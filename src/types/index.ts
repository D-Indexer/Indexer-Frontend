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

/** One row of `GET /portfolios` (ordered by ledger desc): a portfolio plus its owner's Folder name. */
export interface ExplorePortfolio extends Portfolio {
  folderName: string
}

/** Cursor page returned by `GET /portfolios?cursor=&limit=`; `nextCursor` is null on the last page. */
export interface PortfolioPage {
  items: ExplorePortfolio[]
  nextCursor: string | null
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

export type TemplateMetadataStatus = 'verified' | 'unverified' | 'missing' | 'mismatch' | 'error'

export interface TemplateWithMetadata extends Template {
  /** Null when the metadata could not be fetched or did not match its CID. */
  metadata: TemplateMetadata | null
  metadataStatus: TemplateMetadataStatus
}

export type PortfolioLinkKind = 'github' | 'linkedin' | 'website' | 'email' | 'other'

export interface PortfolioLink {
  kind: PortfolioLinkKind
  url: string
  label: string
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
  /** Structured link metadata; absent in legacy documents. */
  link_meta?: PortfolioLink[]
  /** Free-text content for template-specific fields (e.g. `projects`, `case_studies`). */
  sections: Record<string, string>
  /** `markdown`: bio and sections use the restricted Markdown subset. Absent on older documents (plain text). */
  content_format?: 'markdown'
  updated_at: string
}

export interface ApiError {
  code?: string
  docsAnchor?: string
  message: string
  requestId?: string
  status?: number
}
