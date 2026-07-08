import { useEffect } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import PostDetail from './pages/PostDetail'
import PostWrite from './pages/PostWrite'
import { useAuthStore } from './store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App() {
  const login = useAuthStore((s) => s.login)

  useEffect(() => {
    if (!useAuthStore.getState().token) return
    axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
      .then(async (res) => {
        const token = res.data.access_token
        const me = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        login(token, me.data)
      })
      .catch(() => { useAuthStore.getState().logout() })
  }, [])

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/write" element={<PostWrite />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/posts/:id/edit" element={<PostWrite />} />
      </Routes>
    </BrowserRouter>
  )
}
