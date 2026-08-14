export const verificationSteps = [
  {
    title: 'Create metadata',
    description: 'Build a portable profile payload and upload it to IPFS.',
  },
  {
    title: 'Anchor ownership',
    description: 'Connect the profile lifecycle to a Stellar address and configured Folder contract.',
  },
  {
    title: 'Link proof',
    description: 'Attach credentials and on-chain proof-of-work records through the Folder API.',
  },
] as const
