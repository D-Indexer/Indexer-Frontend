import { SectionHeader } from '@/components/ui'
import { FolderOverview } from '@/features/folder'
import { WalletGate } from '@/features/wallet'
import { PageContainer } from '@/layouts'

export const DashboardPage = () => (
  <PageContainer>
    <SectionHeader
      eyebrow="My Folder"
      title="Your folder and portfolio"
      description="Claim a folder name, mint your portfolio NFT and keep it up to date. Every change is a Stellar testnet transaction signed in Freighter."
    />
    <WalletGate>{(address) => <FolderOverview key={address} address={address} />}</WalletGate>
  </PageContainer>
)
