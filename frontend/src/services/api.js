import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased from 10000ms to 30000ms
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    console.log('API Request - Token:', token ? 'Present' : 'Missing')
    console.log('API Request - URL:', config.url)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('API Request - Authorization header set')
    } else {
      console.log('API Request - No token found in localStorage')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    
    // Suppress console errors for expected 404 responses
    if (error.response?.status === 404) {
      // Don't log 404 errors to console as they're often expected
      // (e.g., driver profile not found, user not found, etc.)
      error.suppressConsoleError = true
    }
    
    return Promise.reject(error)
  }
)

export default api
