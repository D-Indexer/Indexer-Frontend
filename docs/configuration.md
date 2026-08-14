# Configuration

Copy `.env.example` to `.env` for local development.

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Folder API base URL. |
| `VITE_STELLAR_NETWORK` | Yes | `testnet` or `mainnet`. |
| `VITE_FOLDER_CONTRACT_ID` | For contract flows | Deployed Folder contract ID. |
| `VITE_IPFS_API_URL` | Yes | IPFS API/gateway base URL. |
| `VITE_GITHUB_API_URL` | Optional | GitHub API base URL for credential flows. |
| `VITE_LINKEDIN_API_URL` | Optional | LinkedIn API base URL for credential flows. |

Do not place secrets in `VITE_` variables. Vite injects them into browser-accessible code.
