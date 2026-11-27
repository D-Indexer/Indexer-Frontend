# Wallet lifecycle

Wallet connection state is synchronized through `BroadcastChannel('folder.wallet')` where available. Connected, disconnected, and changed snapshots are propagated between tabs; implementations must avoid rebroadcast loops when applying remote state.

The watcher should run only while visible and connected, immediately refresh address/network on focus, and back off unchanged polls from three to ten seconds. In-flight transaction flows must abort before signing when owner or network passphrase changes.
