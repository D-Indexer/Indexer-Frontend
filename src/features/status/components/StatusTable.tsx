import { Badge, type BadgeTone } from '@/components/ui'
import type { DependencyCheck, DependencyStatus, IndexerLag } from '@/services/status/statusService'

const toneByStatus: Record<DependencyStatus, BadgeTone> = {
  healthy: 'success',
  degraded: 'warning',
  down: 'danger',
}

const labelByStatus: Record<DependencyStatus, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  down: 'Down',
}

const formatLatency = (latencyMs: number | null) => (latencyMs === null ? '—' : `${latencyMs} ms`)

const formatSeconds = (seconds: number | null) => {
  if (seconds === null) return '—'
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes} min ${seconds % 60} s`
}

interface StatusTableProps {
  dependencies: DependencyCheck[]
}

/** Accessible table of dependency health and latency. */
export const StatusTable = ({ dependencies }: StatusTableProps) => (
  <table className="status-table">
    <caption className="sr-only">Dependency health and latency</caption>
    <thead>
      <tr>
        <th scope="col">Dependency</th>
        <th scope="col">Status</th>
        <th scope="col">Latency</th>
        <th scope="col">Detail</th>
      </tr>
    </thead>
    <tbody>
      {dependencies.map((dependency) => (
        <tr key={dependency.name}>
          <th scope="row">{dependency.name}</th>
          <td>
            <Badge tone={toneByStatus[dependency.status]}>{labelByStatus[dependency.status]}</Badge>
          </td>
          <td>{formatLatency(dependency.latencyMs)}</td>
          <td className="muted">{dependency.detail}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

interface IndexerLagSummaryProps {
  lag: IndexerLag
}

/** Indexer lag against the chain, in ledgers and seconds. */
export const IndexerLagSummary = ({ lag }: IndexerLagSummaryProps) => (
  <dl className="status-lag">
    <div>
      <dt>Indexed ledger</dt>
      <dd>{lag.indexedLedger ?? 'Unknown'}</dd>
    </div>
    <div>
      <dt>Chain ledger</dt>
      <dd>{lag.chainLedger ?? 'Unknown'}</dd>
    </div>
    <div>
      <dt>Lag (ledgers)</dt>
      <dd>{lag.lagLedgers ?? 'Unknown'}</dd>
    </div>
    <div>
      <dt>Lag (seconds)</dt>
      <dd>{formatSeconds(lag.lagSeconds)}</dd>
    </div>
  </dl>
)
