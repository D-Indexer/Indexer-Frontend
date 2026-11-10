/** Persistent notice shown on every page while VITE_DEMO_MODE=true. */
export const DemoBanner = () => (
  <div className="demo-banner" role="note" aria-label="Demo data">
    <strong>Demo data.</strong> VITE_DEMO_MODE is on: everything shown comes from bundled fixtures, not the Folder backend or
    Stellar testnet, and on-chain actions are disabled.
  </div>
)
