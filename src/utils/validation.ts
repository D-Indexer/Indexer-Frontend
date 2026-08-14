export const isRequired = (value: string) => value.trim().length > 0

export const parseDelimitedList = (value: string) => {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const getInvalidUrls = (values: string[]) => {
  return values.filter((value) => !isHttpUrl(value))
}
