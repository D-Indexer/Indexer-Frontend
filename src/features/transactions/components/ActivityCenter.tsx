import { useState } from 'react'
import { explorerLinks, shortenKey } from '@/services'
import { useWalletStore } from '@/store'
import { useActivityStore } from '../activityStore'

export const ActivityCenter = () => {
  const [isOpen, setIsOpen] = useState(false)
  const address = useWalletStore((state) => state.address)
  const activities = useActivityStore((state) => (address ? state.activities[address] ?? [] : []))
  const clearActivities = useActivityStore((state) => state.clearActivities)

  if (!address) return null

  const pendingCount = activities.filter((a) => a.status === 'pending').length

  return (
    <div className="activity-center relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="activity-center__button relative px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium flex items-center gap-2"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Activity center, ${activities.length} transactions, ${pendingCount} pending`}
      >
        <span>Activity</span>
        {pendingCount > 0 ? (
          <span className="badge badge--pending bg-amber-500 text-black px-1.5 py-0.2 rounded-full text-xs font-bold animate-pulse">
            {pendingCount}
          </span>
        ) : activities.length > 0 ? (
          <span className="badge bg-zinc-700 text-zinc-300 px-1.5 py-0.2 rounded-full text-xs">
            {activities.length}
          </span>
        ) : null}
      </button>

      {isOpen && (
        <div
          className="activity-center__dropdown absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-4 z-50 text-sm"
          role="dialog"
          aria-label="Recent Transactions"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="font-semibold text-zinc-100">Recent Transactions</h3>
            {activities.length > 0 && (
              <button
                type="button"
                onClick={() => clearActivities(address)}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="activity-center__list mt-3 max-h-64 overflow-y-auto flex flex-col gap-2">
            {activities.length === 0 ? (
              <p className="text-zinc-500 text-center py-4 text-xs">No recent transactions</p>
            ) : (
              activities.map((tx) => (
                <div
                  key={tx.id}
                  className="activity-item p-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-medium text-zinc-200">{tx.method}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        tx.status === 'success'
                          ? 'bg-green-900 text-green-200'
                          : tx.status === 'pending'
                          ? 'bg-amber-900 text-amber-200'
                          : 'bg-red-900 text-red-200'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                  {tx.hash ? (
                    <a
                      href={explorerLinks.transaction(tx.hash)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:underline font-mono"
                    >
                      Tx: {shortenKey(tx.hash)} ↗
                    </a>
                  ) : null}
                  {tx.error ? <p className="text-xs text-red-400">{tx.error}</p> : null}
                  <span className="text-[10px] text-zinc-500">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
