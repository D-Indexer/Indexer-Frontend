export const isRequired = (value: string) => value.trim().length > 0

export const parseDelimitedList = (value: string) => {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
