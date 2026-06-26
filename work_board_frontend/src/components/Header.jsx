import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LoginModal from './LoginModal'

const navItems = [
  { to: '/', label: '홈' },
]

export default function Header() {
  const [showLogin, setShowLogin] = useState(false)
  const token = useAuthStore((s) => s.token)
  const logout = useAuthStore((s) => s.logout)

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#D0D7DE] bg-[#F6F8FA]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <NavLink to="/" className="text-base font-semibold text-[#1F2328] hover:text-[#0969DA]">
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
            {token ? (
              <button
                onClick={logout}
                className="text-sm text-[#636C76] hover:text-[#1F2328] transition-colors"
              >
                로그아웃
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="rounded-md bg-[#1F2328] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#32383F] transition-colors"
              >
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
