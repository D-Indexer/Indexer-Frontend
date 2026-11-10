export const verificationSteps = [
  {
    title: 'Claim a folder',
    description: 'Reserve a name like jane.folder for your Stellar address with claim_folder.',
  },
  {
    title: 'Mint your portfolio',
    description: 'Write your portfolio, pin it to IPFS through the backend, and anchor its CID with mint_portfolio.',
  },
  {
    title: 'Share and verify',
    description: 'Anyone can open /p/<name>.folder and check it against the contract with verify_portfolio.',
  },
] as const
