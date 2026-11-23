import { http, HttpResponse } from 'msw'
import { env } from '@/config/env'
import { mockDb } from '../db'

const api = (path: string) => `${env.apiUrl}${path}`

const unavailable = () => (mockDb.backendDown ? HttpResponse.json({ error: 'Service unavailable' }, { status: 503 }) : null)
const notFound = () => HttpResponse.json({ error: 'Not found' }, { status: 404 })

/** Indexer-Backend REST endpoints used by the app. */
export const backendHandlers = [
  http.get(api('/folders/name/:name'), ({ params }) => {
    const folder = [...mockDb.folders.values()].find((item) => item.name === params.name)
    return unavailable() ?? (folder ? HttpResponse.json(folder) : notFound())
  }),
  http.get(api('/folders/:owner'), ({ params }) => {
    const folder = mockDb.folders.get(String(params.owner))
    return unavailable() ?? (folder ? HttpResponse.json(folder) : notFound())
  }),
  http.get(api('/portfolios/:owner'), ({ params }) => {
    const portfolio = mockDb.portfolios.get(String(params.owner))
    return unavailable() ?? (portfolio ? HttpResponse.json(portfolio) : notFound())
  }),
  http.get(api('/templates'), () => unavailable() ?? HttpResponse.json(mockDb.templates)),
]
