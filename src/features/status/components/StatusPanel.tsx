import { AsyncContent, Button, Card, SectionHeader } from '@/components/ui'
import { PageContainer } from '@/layouts'
import { IndexerLagSummary, StatusTable } from './StatusTable'
import { useStatusReport } from '../hooks/useStatusReport'

export const StatusPanel = () => {
  const { data, error, loading, refresh } = useStatusReport()

  return (
    <AsyncContent
      data={data}
      error={error}
      loading={loading}
      loadingLabel="Checking dependencies…"
      onRetry={() => void refresh()}
      empty={{ title: 'No status data', description: 'The status probe returned no dependencies.' }}
      isEmpty={(report) => report.dependencies.length === 0}
    >
      {(report) => (
        <div className="stack">
          <Card>
            <SectionHeader level={2} title="Dependencies" description="Probed on every refresh." />
            <StatusTable dependencies={report.dependencies} />
          </Card>
          <Card>
            <SectionHeader level={2} title="Indexer lag" description="Compared with the latest chain ledger." />
            <IndexerLagSummary lag={report.indexerLag} />
          </Card>
          <div className="cluster">
            <Button type="button" variant="secondary" onClick={() => void refresh()}>
              Refresh now
            </Button>
            <span className="muted" role="status" aria-live="polite">
              Last checked {new Date(report.checkedAt).toLocaleTimeString()} · refreshes automatically
            </span>
          </div>
        </div>
      )}
    </AsyncContent>
  )
}
