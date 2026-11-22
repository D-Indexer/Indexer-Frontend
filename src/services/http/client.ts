import axios from 'axios'
import { env } from '@/config/env'

export const apiClient = axios.create({
  timeout: 15_000,
})

// Dynamically set baseURL before each request so runtime config takes effect
apiClient.interceptors.request.use((config) => {
  if (env.apiUrl) {
    config.baseURL = env.apiUrl
  }
  return config
})
