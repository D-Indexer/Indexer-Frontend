/**
 * Privacy-preserving real-user monitoring (RUM).
 *
 * Collects Core Web Vitals (LCP, INP, CLS) with attribution and sends them as anonymous
 * `navigator.sendBeacon` payloads to `VITE_RUM_ENDPOINT`. Disabled unless that variable is set.
 *
 * Only the route template (e.g. `/p/:folderName`), the metric name/value/rating, the attribution
 * element tag and the page's own origin are reported. No URLs with parameters, folder names,
 * wallet addresses, transaction hashes, user agents or other identifiers are sent.
 */

export type WebVitalName = 'CLS' | 'INP' | 'LCP'

export interface WebVitalMetric {
  /** Attribution: the element that caused the shift/entry, if any. */
  attribution?: string
  /** `good` | `needs-improvement` | `poor`, as defined by web-vitals. */
  rating?: string
  /** Milliseconds (LCP, INP) or unitless score (CLS). */
  value: number
}

export interface RumPayload {
  /** Route template only, never the concrete path. */
  route: string
  metric: WebVitalName
  value: number
  rating?: string
  attribution?: string
  /** Page origin, so a single endpoint can serve several deployments. */
  origin: string
}

export interface RumOptions {
  endpoint: string
  /** 0..1 fraction of page loads that report. */
  sampleRate?: number
  /** Route template reported with every metric. */
  route: string
  /** Injectable for tests. */
  random?: () => number
  /** Injectable for tests. */
  send?: (endpoint: string, payload: RumPayload) => boolean
}

const MAX_ATTRIBUTION_LENGTH = 64

/** Keeps only a short, non-identifying element description (e.g. `img`, `div#hero`). */
export const sanitizeAttribution = (value: string | undefined): string | undefined => {
  if (!value) return undefined
  const cleaned = value.replace(/[^a-zA-Z0-9#._-]/g, '').slice(0, MAX_ATTRIBUTION_LENGTH)
  return cleaned || undefined
}

export const buildRumPayload = (
  route: string,
  metric: WebVitalName,
  data: WebVitalMetric,
  origin: string,
): RumPayload => {
  const payload: RumPayload = {
    route,
    metric,
    value: Math.round(data.value * 1000) / 1000,
    origin,
  }
  if (data.rating) payload.rating = data.rating
  const attribution = sanitizeAttribution(data.attribution)
  if (attribution) payload.attribution = attribution
  return payload
}

const defaultSend = (endpoint: string, payload: RumPayload): boolean => {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return false
  try {
    const body = JSON.stringify(payload)
    return navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }))
  } catch {
    return false
  }
}

export interface RumReporter {
  /** Whether this page load is sampled in and has a usable endpoint. */
  readonly enabled: boolean
  report: (metric: WebVitalName, data: WebVitalMetric) => void
}

export const createRumReporter = (options: RumOptions): RumReporter => {
  const { endpoint, sampleRate = 1, route, random = Math.random, send = defaultSend } = options
  const origin = typeof location === 'undefined' ? '' : location.origin
  const enabled = Boolean(endpoint) && sampleRate > 0 && random() < sampleRate

  return {
    enabled,
    report: (metric, data) => {
      if (!enabled) return
      send(endpoint, buildRumPayload(route, metric, data, origin))
    },
  }
}

let routeTemplate = '/'

/** Called by the router on every navigation so reports carry the current route template. */
export const setRumRoute = (template: string) => {
  routeTemplate = template
}

export const getRumRoute = () => routeTemplate

export interface RumInitOptions {
  endpoint: string
  sampleRate?: number
  /** Route template of the current page. */
  route: string
  /** Injectable for tests. */
  random?: () => number
  /** Injectable for tests. */
  send?: (endpoint: string, payload: RumPayload) => boolean
}

/**
 * Starts collection. Returns `null` when RUM is disabled (no endpoint, zero sample rate or this
 * page load was not sampled), so callers can skip loading the web-vitals library entirely.
 */
export const initRum = (options: RumInitOptions): RumReporter | null => {
  const reporter = createRumReporter(options)
  if (!reporter.enabled) return null

  void import('web-vitals').then(({ onCLS, onINP, onLCP }) => {
    const report =
      (metric: WebVitalName) =>
      (entry: { value: number; rating?: string; attribution?: Record<string, unknown> }) => {
        reporter.report(metric, {
          value: entry.value,
          rating: entry.rating,
          attribution: describeAttribution(entry.attribution),
        })
      }
    onLCP(report('LCP'))
    onINP(report('INP'))
    onCLS(report('CLS'))
  })

  return reporter
}

/** Reduces web-vitals attribution to a short element description, dropping URLs and text. */
export const describeAttribution = (attribution: Record<string, unknown> | undefined): string | undefined => {
  if (!attribution) return undefined
  const element = attribution.element
  if (typeof element === 'string') return element
  if (element && typeof element === 'object') {
    const node = element as { id?: unknown; tagName?: unknown }
    const tag = typeof node.tagName === 'string' ? node.tagName.toLowerCase() : ''
    const id = typeof node.id === 'string' && node.id ? `#${node.id}` : ''
    if (tag || id) return `${tag}${id}`
  }
  return undefined
}

/** Reduces web-vitals attribution to a short element description, dropping URLs and text. */
export const describeAttribution = (attribution: Record<string, unknown> | undefined): string | undefined => {
  if (!attribution) return undefined
  const element = attribution.element
  if (typeof element === 'string') return element
  if (element && typeof element === 'object') {
    const node = element as { id?: unknown; tagName?: unknown }
    const tag = typeof node.tagName === 'string' ? node.tagName.toLowerCase() : ''
    const id = typeof node.id === 'string' && node.id ? `#${node.id}` : ''
    if (tag || id) return `${tag}${id}`
  }
  return undefined
}
