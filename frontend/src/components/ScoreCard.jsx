export default function ScoreCard({ label, score, weight, color = 'blue', icon }) {
  const colorMap = {
    blue: { bar: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    green: { bar: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    purple: { bar: 'bg-purple-500', text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    orange: { bar: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    pink: { bar: 'bg-pink-500', text: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{label}</p>
            <p className="text-xs text-gray-500">Weight: {weight}</p>
          </div>
        </div>
        <span className={`text-2xl font-bold ${c.text}`}>{score}</span>
      </div>
      <div className="w-full bg-white rounded-full h-2.5 border border-gray-200">
        <div
          className={`${c.bar} h-2.5 rounded-full transition-all duration-700`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  )
}
