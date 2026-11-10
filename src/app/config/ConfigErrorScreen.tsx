import type { EnvIssue } from '@/config/env'

interface ConfigErrorScreenProps {
  issues: EnvIssue[]
}

/** Rendered instead of the app when required `VITE_*` variables are missing or invalid. */
export const ConfigErrorScreen = ({ issues }: ConfigErrorScreenProps) => {
  return (
    <main className="config-error" aria-labelledby="config-error-title">
      <h1 id="config-error-title">Folder is not configured</h1>
      <p>
        The app was built with missing or invalid environment variables. Fix them in <code>.env</code> (see{' '}
        <code>.env.example</code> and <code>docs/configuration.md</code>) and restart the dev server or rebuild.
      </p>
      <ul className="config-error__list">
        {issues.map((issue) => (
          <li key={issue.variable}>
            <code>{issue.variable}</code>: {issue.message}
          </li>
        ))}
      </ul>
      <p className="muted">
        To try the UI without a backend, set <code>VITE_DEMO_MODE=true</code>.
      </p>
    </main>
  )
}
