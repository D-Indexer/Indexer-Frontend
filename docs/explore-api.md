# Explore endpoint (Indexer-Backend)

`GET /portfolios?cursor=<opaque>&limit=<1-50>` returns portfolios ordered by ledger desc (most recently minted or updated first):

```json
{ "items": [{ "owner": "G...", "folderName": "jane.folder", "templateId": 1, "ipfsCid": "bafk...", "mintedAt": "ISO", "updatedAt": "ISO" }], "nextCursor": "opaque-or-null" }
```

The frontend `/explore` page keeps the cursor of the latest loaded page in `?cursor=`, appends pages via "Load more", and calls
`verify_portfolio` for a card only when it scrolls into view. In demo mode it pages bundled fixtures and skips the RPC.
