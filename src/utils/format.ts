export const formatXlm = (amount: number) => `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM`

export const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}
