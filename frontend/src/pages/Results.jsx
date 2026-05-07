import { useLocation, useNavigate, Link } from 'react-router-dom'
import OverallScore from '../components/OverallScore'
import ScoreCard from '../components/ScoreCard'
import InfoList from '../components/InfoList'

const scoreCards = [
  { key: 'skill_match', label: 'Skill Match', weight: '35%', color: 'blue', icon: '🔧' },
  { key: 'project_relevance', label: 'Project Relevance', weight: '25%', color: 'purple', icon: '💡' },
  { key: 'experience_relevance', label: 'Experience', weight: '20%', color: 'green', icon: '💼' },
  { key: 'resume_strength', label: 'Resume Strength', weight: '10%', color: 'orange', icon: '📄' },
  { key: 'certifications_score', label: 'Certifications', weight: '10%', color: 'pink', icon: '🏅' },
]

export default function Results() {
  const { state } = useLocation()
  const navigate = useNavigate()

  if (!state?.result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600 text-lg">No results to display.</p>
        <Link to="/analyze" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700">
          Go to Analyzer
        </Link>
      </div>
    )
  }

  const r = state.result

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analysis Results</h1>
          <p className="text-gray-500">
            {r.student_name} · <span className="font-medium text-blue-600">{r.target_role}</span>
            {r.timestamp && <span className="text-gray-400 text-sm ml-2">· {new Date(r.timestamp).toLocaleString()}</span>}
          </p>
          <div className="mt-3">
            {r.ai_powered
              ? <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold">🤖 Powered by Groq AI · llama-3.3-70b</span>
              : <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-xs font-semibold">📋 Rule-based analysis</span>
            }
          </div>
        </div>

        {/* Overall + Score Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <OverallScore
              score={r.scores.overall_score}
              level={r.recommendation_level}
              message={r.recommendation_message}
            />
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
            {scoreCards.map(({ key, label, weight, color, icon }) => (
              <ScoreCard
                key={key}
                label={label}
                score={r.scores[key]}
                weight={weight}
                color={color}
                icon={icon}
              />
            ))}
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <InfoList
            title="Strengths"
            items={r.strengths}
            icon="✅"
            dotColor="bg-green-500"
            bgClass="bg-green-50"
          />
          <InfoList
            title="Areas to Improve"
            items={r.weaknesses}
            icon="⚠️"
            dotColor="bg-orange-400"
            bgClass="bg-orange-50"
          />
        </div>

        {/* Missing Keywords */}
        {r.missing_keywords?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>🔍</span> Missing Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {r.missing_keywords.map(kw => (
                <span key={kw} className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-medium">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Resume Improvements */}
        <div className="mb-6">
          <InfoList
            title="Resume Improvement Suggestions"
            items={r.resume_improvements}
            icon="✍️"
            dotColor="bg-blue-500"
          />
        </div>

        {/* Learning Roadmap */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6 mb-8">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-lg">
            <span>🗺️</span> Learning Roadmap for {r.target_role}
          </h3>
          <ol className="space-y-3">
            {r.learning_roadmap.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-gray-700 text-sm pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => navigate('/analyze')}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Analyze Again
          </button>
          <Link
            to="/history"
            className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            View History
          </Link>
        </div>
      </div>
    </div>
  )
}
