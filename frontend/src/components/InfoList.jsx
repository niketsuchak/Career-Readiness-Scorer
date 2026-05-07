export default function InfoList({ title, items, icon, colorClass = 'text-gray-700', bgClass = 'bg-white', dotColor = 'bg-gray-400' }) {
  return (
    <div className={`rounded-xl border border-gray-200 ${bgClass} p-5`}>
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
