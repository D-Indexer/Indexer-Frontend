# Wallet-change flow aborts

Every contract flow captures the connected account and network passphrase at start. A Zustand wallet-store change aborts the flow before signing and again before submission. The user receives “Your wallet changed during this action. Nothing was signed.” No signed XDR is submitted after an abort.
