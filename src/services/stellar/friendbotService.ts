const FRIEND_BOT = 'https://friendbot.stellar.org'
export class FriendbotError extends Error { constructor(message: string) { super(message); this.name = 'FriendbotError' } }
export const friendbotService = {
  fund: async (address: string): Promise<void> => {
    const response = await fetch(`${FRIEND_BOT}/?addr=${encodeURIComponent(address)}`)
    if (response.ok || response.status === 400) return // Friendbot already-funded responses are safe to resume from.
    throw new FriendbotError(`Friendbot could not fund this account (HTTP ${response.status}).`)
  },
}
