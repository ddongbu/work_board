import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LoginModal from './LoginModal'

export default function Header() {
  const [showLogin, setShowLogin] = useState(false)
  const token = useAuthStore((s) => s.token)
  const logout = useAuthStore((s) => s.logout)

  return (
    <>
      <header className="sticky top-0 z-40 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="text-xl font-bold tracking-tight text-gray-900">
            You<span className="text-green-500">Quest</span>
          </Link>
          <div className="flex items-center gap-4">
            {token ? (
              <>
                <Link
                  to="/write"
                  className="px-4 py-1.5 rounded-full border border-green-500 text-green-500 text-sm font-medium hover:bg-green-50 transition-colors"
                >
                  새 글 작성
                </Link>
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-1.5 rounded-full bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </header>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
