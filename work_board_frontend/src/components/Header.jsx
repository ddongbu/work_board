import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LoginModal from './LoginModal'
import api from '../services/api'

export default function Header() {
  const [showLogin, setShowLogin] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    try {
      await api.post('/auth/logout')
    } catch {}
    logout()
    navigate('/')
    setDropdownOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="text-xl font-bold tracking-tight text-gray-900">
            You<span className="text-blue-600">Quest</span>
          </Link>

          <div className="flex items-center gap-4">
            {token ? (
              <>
                <Link
                  to="/write"
                  className="px-4 py-1.5 rounded-full border border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  새 글 작성
                </Link>

                {/* 프로필 드롭다운 */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-1 focus:outline-none"
                  >
                    {user?.profile_image_url ? (
                      <img
                        src={user.profile_image_url}
                        alt="프로필"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: `hsl(${(user?.nickname?.charCodeAt(0) ?? 0) * 37 % 360}, 60%, 50%)` }}
                      >
                        {user?.nickname?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                      <Link
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        설정
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
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
