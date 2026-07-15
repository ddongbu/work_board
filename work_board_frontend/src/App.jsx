import { useEffect } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { setTitle } from './utils/title'
import Header from './components/Header'
import Home from './pages/Home'
import PostDetail from './pages/PostDetail'
import PostWrite from './pages/PostWrite'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import { useAuthStore } from './store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const STATIC_TITLES = {
  '/': null,
  '/write': '새글 작성',
  '/settings': '설정',
  '/404': '페이지를 찾을 수 없습니다',
}

function TitleManager() {
  const { pathname } = useLocation()
  useEffect(() => {
    const base = pathname.replace(/\/posts\/\d+.*/, '/posts/:id')
    if (base in STATIC_TITLES) setTitle(STATIC_TITLES[base])
  }, [pathname])
  return null
}

function SettingsGuard() {
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()
  useEffect(() => {
    if (!token) navigate('/', { replace: true })
  }, [token, navigate])
  if (!token) return null
  return <Settings />
}

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
      <TitleManager />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/write" element={<PostWrite />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/posts/:id/edit" element={<PostWrite />} />
        <Route path="/settings" element={<SettingsGuard />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
