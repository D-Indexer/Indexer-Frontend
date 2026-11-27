# Embeddable `<folder-verify>` widget

A framework-agnostic Web Component that shows live on-chain verification for a folder on any web page.

```html
<script type="module" src="https://your-host/folder-verify.js"></script>
<folder-verify name="jane.folder" site-url="https://folder.example"></folder-verify>
```

- `name` (required): the folder name. Changing it re-runs the check.
- `site-url` (optional): origin of the Folder app; adds a "View portfolio" link to `/p/<name>`.

States: **Checking**, **verified** (green), **Not verified** (folder unclaimed or no portfolio NFT), and **Verification
unavailable** (indexer, RPC or IPFS error, or content that does not hash to its on-chain CID).

The widget renders in a Shadow DOM: its styles do not leak out and page CSS does not leak in. It has no React
dependency; the logic lives in `src/embed/verifyFolder.ts` (unit-tested) and reuses `stellarService` and `cid.ts`.

## Build

```sh
npm run build:embed   # vite build --config vite.embed.config.ts, then prints the gzip size
```

The output is `dist-embed/folder-verify.js` (single ES module). Configuration is baked in at build time from the same
`VITE_API_URL`, `VITE_FOLDER_CONTRACT_ID`, `VITE_SOROBAN_RPC_URL` and `VITE_IPFS_GATEWAY_URL` variables as the app
(see `configuration.md`). CI runs `build:embed` and writes the size to the job summary; set `EMBED_MAX_GZIP_KB` to make
it fail above a budget.

### Size budget

The target is < 60 KB gzip. The widget's own code is a few KB, but the read path goes through `@stellar/stellar-sdk`
(XDR encoding of the contract call and decoding of the result), which dominates the bundle and will exceed 60 KB. CI
therefore reports the size rather than enforcing 60 KB. Reaching the budget needs a hand-written minimal XDR codec for
`verify_portfolio` / `get_portfolio` as a follow-up; `VerifyDeps` in `verifyFolder.ts` is the seam for that swap.

## CSP requirements

The host page needs:

- `script-src` allowing the host serving `folder-verify.js`.
- `connect-src` allowing the Indexer-Backend URL, the Soroban RPC URL and the IPFS gateway URL.

No inline scripts, `unsafe-eval`, images or fonts are used. (The widget injects one `<style>` element inside its shadow
root; if your CSP restricts `style-src`, allow `'unsafe-inline'` for it or use constructable stylesheets in a follow-up.)

## Demo

Open [`embed-demo.html`](./embed-demo.html) after `npm run build:embed` (serve the repo root, e.g. `npx vite preview`
or any static server) to see the element embedded on a plain page.
