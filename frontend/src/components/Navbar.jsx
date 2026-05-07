import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/assessment', label: '🤖 AI Assessment', highlight: true },
  { to: '/analyze', label: 'Resume Analyzer' },
  { to: '/history', label: 'History' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const isAssessment = pathname.startsWith('/assessment')

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <span className="text-2xl">🎯</span> CareerScore AI
        </Link>
        <div className="flex gap-1">
          {links.map(({ to, label, highlight }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? highlight ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                    : highlight ? 'text-purple-600 hover:bg-purple-50 border border-purple-200' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
