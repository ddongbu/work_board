import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
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
    const isAuthEndpoint = original.url?.includes('/auth/login') || original.url?.includes('/auth/signup')
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
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

export const uploadImage = (file, folder = 'posts') => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/upload?folder=${folder}`, form)
}

export const updateProfile = (nickname, profile_image_url) =>
  api.put('/mypage/profile', { nickname, profile_image_url })

export const changePassword = (current_password, new_password) =>
  api.put('/mypage/password', { current_password, new_password })

export const deleteAccount = () => api.delete('/mypage/account')

export const updateComment = (postId, commentId, content) =>
  api.put(`/posts/${postId}/comments/${commentId}`, { content })

export default api
