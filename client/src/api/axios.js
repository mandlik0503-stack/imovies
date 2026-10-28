import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: add Authorization header from localStorage token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('imovies_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor:
// 1. Unwraps data smartly while maintaining compatibility for res.data and res.data.data
// 2. Handles 401 unauthorized
API.interceptors.response.use(
  (response) => {
    const raw = response.data
    if (raw && typeof raw === 'object' && raw.success !== undefined && raw.data !== undefined) {
      const inner = raw.data
      if (Array.isArray(inner)) {
        inner.data = inner
        inner.success = raw.success
        inner.message = raw.message
        response.data = inner
      } else if (typeof inner === 'object' && inner !== null) {
        inner.data = inner
        inner.success = raw.success
        inner.message = raw.message
        response.data = inner
      }
    }
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const publicPaths = ['/', '/landing', '/login', '/register']
      if (!publicPaths.includes(window.location.pathname)) {
        localStorage.removeItem('imovies_token')
        localStorage.removeItem('imovies_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default API
