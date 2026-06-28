import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LoginModal from './LoginModal'

const navItems = [
  { to: '/', label: '홈' },
]

export default function Header() {
  const [showLogin, setShowLogin] = useState(false)
  const token = useAuthStore((s) => s.token)
  const logout = useAuthStore((s) => s.logout)
  const isLoggedIn = !!token

  function handleLogout() {
    logout()
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#D0D7DE] bg-[#F6F8FA]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <NavLink to="/" className="text-xl font-bold text-green-500">
            유퀘스트
          </NavLink>
          <nav className="flex items-center gap-6">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `text-sm transition-colors ${
                    isActive
                      ? 'font-semibold text-[#0969DA]'
                      : 'text-[#636C76] hover:text-[#1F2328]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {isLoggedIn ? (
              <>
                <Link to="/write"
                  className="px-4 py-1.5 rounded-full border border-green-500 text-green-500 text-sm hover:bg-green-50">
                  새 글 작성
                </Link>
                <button onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700">
                  로그아웃
                </button>
              </>
            ) : (
              <button onClick={() => setShowLogin(true)}
                className="px-4 py-1.5 rounded-full bg-green-500 text-white text-sm hover:bg-green-600">
                로그인
              </button>
            )}
          </nav>
        </div>
      </header>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
