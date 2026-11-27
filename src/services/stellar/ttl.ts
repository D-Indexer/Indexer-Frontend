export const LEDGER_SECONDS = 5
export type TtlStatus = 'healthy' | 'expiring' | 'archived'
export const ttlStatus = (liveUntil: number | null, latestLedger: number, threshold = 100_000): TtlStatus => !liveUntil || liveUntil <= latestLedger ? 'archived' : liveUntil - latestLedger <= threshold ? 'expiring' : 'healthy'
export const ledgersToDays = (ledgers: number) => (ledgers * LEDGER_SECONDS) / 86_400
