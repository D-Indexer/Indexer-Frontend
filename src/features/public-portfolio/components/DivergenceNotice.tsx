import type { Divergence } from '../hooks/usePublicPortfolio'

export const DivergenceNotice = ({ divergence }: { divergence: Divergence[] }) => {
  if (divergence.length === 0) return null
  return (
    <div className="notice notice--info notice--stack" role="status">
      <p>The index is behind the chain; showing on-chain data.</p>
      <details>
        <summary>Diagnostic details</summary>
        <ul>
          {divergence.map((d) => (
            <li key={d.field}>
              <span className="mono">{d.field}</span>: indexed {String(d.indexed ?? 'none')}, on-chain {String(d.onChain)}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
