import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

function setAccessToken(token) {
  useAuthStore.getState().login(token, useAuthStore.getState().user)
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const res = await axios.post(
          `${original.baseURL || 'http://localhost:8000'}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        setAccessToken(res.data.access_token)
        original.headers.Authorization = `Bearer ${res.data.access_token}`
        return api(original)
      } catch {
        setAccessToken(null)
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default api
