import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: '홈' },
  { to: '/posts', label: '글목록' },
  { to: '/portfolio', label: '포트폴리오' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#D0D7DE] bg-[#F6F8FA]">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <NavLink to="/" className="text-base font-semibold text-[#1F2328] hover:text-[#0969DA]">
          워크보드
        </NavLink>
        <nav className="flex gap-6">
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
        </nav>
      </div>
    </header>
  )
}
