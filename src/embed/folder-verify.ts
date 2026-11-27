import { env } from '@/config/env'
import { stellarService } from '@/services/stellar/stellarService'
import { verifyFolder, type EmbedState, type VerifyDeps } from './verifyFolder'

const STYLE = `
:host { display: inline-block; font: 14px/1.4 system-ui, sans-serif; }
.box { display: flex; gap: 8px; align-items: flex-start; padding: 8px 12px; border: 1px solid #d9e0ea; border-radius: 8px; background: #fff; color: #172033; }
.box[data-status="verified"] { border-color: #16a34a; }
.box[data-status="not_minted"] { border-color: #d97706; }
.box[data-status="error"] { border-color: #dc2626; }
.title { font-weight: 700; margin: 0; }
.detail { margin: 2px 0 0; color: #667085; overflow-wrap: anywhere; }
a { color: #2563eb; }
`

const deps: VerifyDeps = {
  getOwner: async (name) => {
    const response = await fetch(`${env.apiUrl}/folders/name/${encodeURIComponent(name)}`)
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`Indexer returned ${response.status}.`)
    return ((await response.json()) as { owner: string }).owner
  },
  chain: stellarService,
  fetchContent: async (cid) => {
    const response = await fetch(`${env.ipfsGatewayUrl}/${cid}`)
    if (!response.ok) throw new Error(`IPFS gateway returned ${response.status}.`)
    return new Uint8Array(await response.arrayBuffer())
  },
}

const text = (tag: string, className: string, value: string) => {
  const element = document.createElement(tag)
  element.className = className
  element.textContent = value
  return element
}

/** `<folder-verify name="jane.folder">`: shows live on-chain verification. Rendered in Shadow DOM, no global CSS. */
export class FolderVerify extends HTMLElement {
  static observedAttributes = ['name', 'site-url']
  private run = 0

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' })
    void this.refresh()
  }

  attributeChangedCallback() {
    if (this.isConnected) void this.refresh()
  }

  private render(state: EmbedState | { status: 'loading' }) {
    const root = this.shadowRoot
    if (!root) return
    const name = this.getAttribute('name') ?? ''
    const box = document.createElement('div')
    box.className = 'box'
    box.dataset.status = state.status
    box.setAttribute('role', 'status')
    const body = document.createElement('div')
    switch (state.status) {
      case 'loading':
        body.append(text('p', 'title', 'Checking on Stellar…'))
        break
      case 'verified':
        body.append(text('p', 'title', `✓ ${state.displayName} is verified on Stellar`))
        body.append(text('p', 'detail', `${name} · CID ${state.cid}`))
        break
      case 'not_minted':
        body.append(text('p', 'title', 'Not verified'), text('p', 'detail', state.reason))
        break
      case 'error':
        body.append(text('p', 'title', 'Verification unavailable'), text('p', 'detail', state.message))
        break
    }
    const siteUrl = this.getAttribute('site-url')
    if (state.status !== 'loading' && name && siteUrl) {
      const link = document.createElement('a')
      link.href = new URL(`/p/${encodeURIComponent(name)}`, siteUrl).href
      link.target = '_blank'
      link.rel = 'noreferrer'
      link.textContent = 'View portfolio'
      body.append(link)
    }
    box.append(body)
    const style = document.createElement('style')
    style.textContent = STYLE
    root.replaceChildren(style, box)
  }

  private async refresh() {
    const run = ++this.run
    this.render({ status: 'loading' })
    const state = await verifyFolder(this.getAttribute('name') ?? '', deps)
    if (run === this.run) this.render(state)
  }
}

if (!customElements.get('folder-verify')) customElements.define('folder-verify', FolderVerify)
