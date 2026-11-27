/** Exact stroop arithmetic for UI warnings; callers populate these values from an account ledger entry. */
export const spendableStroops = (balance: bigint, minimumBalance: bigint, sellingLiabilities = 0n) => {
  const available = balance - minimumBalance - sellingLiabilities
  return available > 0n ? available : 0n
}

export const canCoverFee = (spendable: bigint, fee: bigint) => spendable >= fee
