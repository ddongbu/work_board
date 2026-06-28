import { useState } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function LoginModal({ onClose }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const form = new URLSearchParams()
      form.append('username', username)
      form.append('password', password)
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup'
      const { data } = await api.post(endpoint, form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      login(data.access_token, { username })
      onClose()
    } catch {
      setError(
        mode === 'login'
          ? '아이디 또는 비밀번호가 올바르지 않습니다.'
          : '회원가입에 실패했습니다. 다시 시도해주세요.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-[#D0D7DE] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-[#1F2328]">
          {mode === 'login' ? '로그인' : '회원가입'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="rounded-md border border-[#D0D7DE] px-3 py-2 text-sm outline-none focus:border-[#0969DA] focus:ring-1 focus:ring-[#0969DA]"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-md border border-[#D0D7DE] px-3 py-2 text-sm outline-none focus:border-[#0969DA] focus:ring-1 focus:ring-[#0969DA]"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-[#1F2328] py-2 text-sm font-medium text-white hover:bg-[#32383F] disabled:opacity-60 transition-colors"
          >
            {loading
              ? mode === 'login' ? '로그인 중...' : '가입 중...'
              : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-[#636C76]">
          {mode === 'login' ? (
            <>
              아직 회원이 아니신가요?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError('') }}
                className="text-[#0969DA] hover:underline"
              >
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError('') }}
                className="text-[#0969DA] hover:underline"
              >
                로그인
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
