export interface ExplorerProvider {
  name: string
  account(address: string, network?: string): string | null
  contract(contractId: string, network?: string): string | null
  transaction(hash: string, network?: string): string | null
}

export class StellarExpertExplorer implements ExplorerProvider {
  name = 'stellar.expert'

  account(address: string, network = 'testnet'): string {
    return `https://stellar.expert/explorer/${network}/account/${address}`
  }

  contract(contractId: string, network = 'testnet'): string {
    return `https://stellar.expert/explorer/${network}/contract/${contractId}`
  }

  transaction(hash: string, network = 'testnet'): string {
    return `https://stellar.expert/explorer/${network}/tx/${hash}`
  }
}

export class StellarChainExplorer implements ExplorerProvider {
  name = 'stellarchain'

  account(address: string, network = 'testnet'): string {
    const prefix = network === 'testnet' ? 'testnet.' : ''
    return `https://${prefix}stellarchain.io/address/${address}`
  }

  contract(contractId: string, network = 'testnet'): string {
    const prefix = network === 'testnet' ? 'testnet.' : ''
    return `https://${prefix}stellarchain.io/contract/${contractId}`
  }

  transaction(hash: string, network = 'testnet'): string {
    const prefix = network === 'testnet' ? 'testnet.' : ''
    return `https://${prefix}stellarchain.io/tx/${hash}`
  }
}

export class NoneExplorer implements ExplorerProvider {
  name = 'none'

  account(_address?: string, _network?: string): null {
    return null
  }

  contract(_contractId?: string, _network?: string): null {
    return null
  }

  transaction(_hash?: string, _network?: string): null {
    return null
  }
}

export const explorerProviders: Record<string, ExplorerProvider> = {
  'stellar.expert': new StellarExpertExplorer(),
  stellarchain: new StellarChainExplorer(),
  none: new NoneExplorer(),
}
