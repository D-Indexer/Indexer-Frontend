import axios from 'axios'
import { env } from '@/config/env'
import { sep10Client } from '@/services/stellar/sep10Client'

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
})
apiClient.interceptors.request.use((config) => {
  const token = sep10Client.token()
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
  return config
})
