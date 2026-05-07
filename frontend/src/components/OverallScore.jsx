const levelConfig = {
  'Interview Ready': { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700' },
  'Strong Candidate': { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  'Needs Improvement': { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  'Beginner Level': { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
}

export default function OverallScore({ score, level, message }) {
  const cfg = levelConfig[level] || levelConfig['Needs Improvement']
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-8 text-center`}>
      <div className="relative inline-flex items-center justify-center mb-4">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="70" cy="70" r="54" fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${cfg.color} transition-all duration-1000`}
          />
        </svg>
        <div className="absolute text-center">
          <span className={`text-4xl font-bold ${cfg.color}`}>{score}</span>
          <span className="text-gray-500 text-sm block">/100</span>
        </div>
      </div>
      <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${cfg.badge} mb-3`}>
        {level}
      </span>
      <p className="text-gray-600 text-sm max-w-xs mx-auto">{message}</p>
    </div>
  )
}
