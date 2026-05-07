import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { getInterviewQuestions } from '../services/api'

const levelConfig = {
  'Expert':     { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700' },
  'Proficient': { color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-200',  badge: 'bg-blue-100 text-blue-700' },
  'Developing': { color: 'text-orange-600',bg: 'bg-orange-50',border: 'border-orange-200',badge: 'bg-orange-100 text-orange-700' },
  'Beginner':   { color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200',   badge: 'bg-red-100 text-red-700' },
}

const proficiencyColors = {
  expert:       'bg-green-500',
  proficient:   'bg-blue-500',
  familiar:     'bg-yellow-500',
  beginner:     'bg-orange-500',
  no_knowledge: 'bg-red-500',
}

const resourceIcons = { course: '🎓', video: '▶️', docs: '📖', book: '📚', practice: '💻', interactive: '🎮' }
const readinessColors = {
  'Ready to interview':    'bg-green-100 text-green-700 border-green-200',
  '1 month away':          'bg-blue-100 text-blue-700 border-blue-200',
  '2-3 months away':       'bg-orange-100 text-orange-700 border-orange-200',
  '6+ months away':        'bg-red-100 text-red-700 border-red-200',
}

export default function AssessmentResults() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [iqData, setIqData] = useState(null)
  const [iqLoading, setIqLoading] = useState(false)
  const [iqError, setIqError] = useState('')
  const [openIdx, setOpenIdx] = useState(null)

  const handleLoadQuestions = async () => {
    setIqLoading(true)
    setIqError('')
    try {
      const { data } = await getInterviewQuestions({ session_id: state.report.session_id })
      setIqData(data)
    } catch (err) {
      setIqError(err.response?.data?.detail || 'Failed to generate questions.')
    } finally {
      setIqLoading(false)
    }
  }

  if (!state?.report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">No assessment results found.</p>
        <Link to="/assessment" className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700">
          Start Assessment
        </Link>
      </div>
    )
  }

  const r = state.report
  const cfg = levelConfig[r.proficiency_level] || levelConfig['Developing']
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (r.overall_proficiency_score / 100) * circumference

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Assessment Report</h1>
          <p className="text-gray-500 mb-3">
            {r.candidate_name} · <span className="font-medium text-purple-600">{r.target_role}</span>
          </p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold">
            🤖 Assessed by Groq AI · llama-3.3-70b
          </span>
        </div>

        {/* Overall score + readiness */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Circular score */}
          <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-8 text-center`}>
            <div className="relative inline-flex items-center justify-center mb-4">
              <svg width="140" height="140" className="-rotate-90">
                <circle cx="70" cy="70" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle cx="70" cy="70" r="54" fill="none" stroke="currentColor" strokeWidth="10"
                  strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                  className={`${cfg.color} transition-all duration-1000`} />
              </svg>
              <div className="absolute text-center">
                <span className={`text-4xl font-bold ${cfg.color}`}>{r.overall_proficiency_score}</span>
                <span className="text-gray-500 text-sm block">/100</span>
              </div>
            </div>
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${cfg.badge} mb-3`}>
              {r.proficiency_level}
            </span>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${readinessColors[r.interview_readiness] || 'bg-gray-100 text-gray-600 border-gray-200'} mt-2`}>
              🎯 {r.interview_readiness}
            </div>
          </div>

          {/* Skill scores */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Skill Proficiency Breakdown</h3>
            <div className="space-y-3">
              {r.skill_scores?.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{s.skill}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                        s.proficiency_level === 'expert' ? 'bg-green-100 text-green-700' :
                        s.proficiency_level === 'proficient' ? 'bg-blue-100 text-blue-700' :
                        s.proficiency_level === 'familiar' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'}`}>
                        {s.proficiency_level?.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-bold text-gray-800">{s.proficiency_score}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${proficiencyColors[s.proficiency_level] || 'bg-gray-400'} h-2 rounded-full transition-all duration-700`}
                      style={{ width: `${s.proficiency_score}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{s.score_reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <span>💡</span> AI Assessment Summary
          </h3>
          <p className="text-gray-700 text-sm leading-relaxed">{r.summary}</p>
        </div>

        {/* Top 3 priorities */}
        {r.top_3_priorities?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><span>🎯</span> Top 3 Priorities</h3>
            <div className="space-y-3">
              {r.top_3_priorities.map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                  <p className="text-sm text-gray-700 pt-0.5">{p}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skill gap analysis */}
        {r.skill_gap_analysis?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><span>📊</span> Skill Gap Analysis</h3>
            <div className="space-y-3">
              {r.skill_gap_analysis.map((g, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">{g.skill}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        g.priority === 'high' ? 'bg-red-100 text-red-700' :
                        g.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'}`}>
                        {g.priority} priority
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Current: {g.current_score}</span>
                      <span>→</span>
                      <span>Required: {g.required_level}</span>
                      <span className="text-red-600 font-medium">Gap: {g.gap}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Adjacent skills */}
        {r.adjacent_skills?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><span>🔗</span> Adjacent Skills You Can Realistically Acquire</h3>
            <p className="text-xs text-gray-500 mb-4">Skills you can learn given your current background</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {r.adjacent_skills.map((adj, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800">{adj.skill}</span>
                    <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">⏱ {adj.time_to_learn}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Why achievable:</span> {adj.why_adjacent}</p>
                  <p className="text-xs text-gray-600 mb-3"><span className="font-medium">Impact:</span> {adj.impact}</p>
                  {adj.resources?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {adj.resources.slice(0, 2).map((res, j) => (
                        <a key={j} href={res.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1">
                          {resourceIcons[res.type] || '🔗'} {res.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personalised Learning Plan */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 p-6 mb-8">
          <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2 text-lg"><span>🗺️</span> Personalised Learning Plan</h3>
          <p className="text-xs text-gray-500 mb-5">Ordered by priority · Tailored to your skill gaps</p>
          <div className="space-y-5">
            {r.learning_plan?.map((step, i) => (
              <div key={i} className="bg-white rounded-xl border border-indigo-100 p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{step.focus}</span>
                      <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">{step.week_range}</span>
                      <span className="text-xs bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full">⏱ {step.time_estimate}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{step.goal}</p>
                  </div>
                </div>
                {step.resources?.length > 0 && (
                  <div className="ml-11 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resources</p>
                    {step.resources.map((res, j) => (
                      <a key={j} href={res.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 group">
                        <span>{resourceIcons[res.type] || '🔗'}</span>
                        <span className="group-hover:underline">{res.title}</span>
                        <span className="text-xs text-gray-400">· {res.duration}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mock Interview Questions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-lg">
                <span>🎤</span> Mock Interview Questions
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                AI-generated questions focused on your weak skills — exactly what interviewers ask
              </p>
            </div>
            {!iqData && (
              <button
                onClick={handleLoadQuestions}
                disabled={iqLoading}
                className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
              >
                {iqLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Generating...
                  </>
                ) : '⚡ Generate Questions'}
              </button>
            )}
          </div>

          {iqError && <p className="text-red-600 text-sm mt-2">⚠️ {iqError}</p>}

          {iqData && (
            <div className="mt-5 space-y-6">

              {/* Preparation tips */}
              {iqData.preparation_tips?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">💡 Preparation Tips</p>
                  <ul className="space-y-1">
                    {iqData.preparation_tips.map((tip, i) => (
                      <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weak skill questions */}
              {iqData.weak_skill_questions?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    Focus Areas — Questions on Your Weak Skills
                  </p>
                  <div className="space-y-3">
                    {iqData.weak_skill_questions.map((q, i) => (
                      <QuestionCard key={i} q={q} idx={`w${i}`} openIdx={openIdx} setOpenIdx={setOpenIdx} color="red" />
                    ))}
                  </div>
                </div>
              )}

              {/* Strong skill questions */}
              {iqData.strong_skill_questions?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    Strength Challenges — Advanced Questions on Your Strong Skills
                  </p>
                  <div className="space-y-3">
                    {iqData.strong_skill_questions.map((q, i) => (
                      <QuestionCard key={i} q={q} idx={`s${i}`} openIdx={openIdx} setOpenIdx={setOpenIdx} color="green" />
                    ))}
                  </div>
                </div>
              )}

              {/* Behavioral questions */}
              {iqData.behavioral_questions?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    Behavioral Questions (STAR Format)
                  </p>
                  <div className="space-y-3">
                    {iqData.behavioral_questions.map((q, i) => (
                      <BehavioralCard key={i} q={q} idx={`b${i}`} openIdx={openIdx} setOpenIdx={setOpenIdx} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center flex-wrap">
          <button onClick={() => navigate('/assessment')}
            className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors">
            New Assessment
          </button>
          <Link to="/analyze"
            className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
            Resume Analyzer
          </Link>
          <Link to="/history"
            className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
            View History
          </Link>
        </div>
      </div>
    </div>
  )
}

const difficultyColors = {
  easy:   'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard:   'bg-red-100 text-red-700',
}

function QuestionCard({ q, idx, openIdx, setOpenIdx, color }) {
  const isOpen = openIdx === idx
  const border = color === 'red'
    ? 'border-red-100 hover:border-red-300'
    : 'border-green-100 hover:border-green-300'
  return (
    <div className={`border rounded-xl transition-colors ${border}`}>
      <button
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
        onClick={() => setOpenIdx(isOpen ? null : idx)}
      >
        <div className="flex items-start gap-3 flex-1">
          <div className="flex flex-col gap-1 flex-shrink-0 mt-0.5">
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{q.skill}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColors[q.difficulty] || 'bg-gray-100 text-gray-600'}`}>
              {q.difficulty}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-800">{q.question}</p>
        </div>
        <span className="text-gray-400 flex-shrink-0 mt-0.5">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1">🔍 What the interviewer is testing</p>
            <p className="text-sm text-blue-800">{q.what_interviewer_tests}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-green-700 mb-1">💡 Answer hint</p>
            <p className="text-sm text-green-800">{q.answer_hint}</p>
          </div>
          {q.follow_up && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">➡️ Likely follow-up</p>
              <p className="text-sm text-gray-700 italic">"{q.follow_up}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BehavioralCard({ q, idx, openIdx, setOpenIdx }) {
  const isOpen = openIdx === idx
  return (
    <div className="border border-blue-100 hover:border-blue-300 rounded-xl transition-colors">
      <button
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
        onClick={() => setOpenIdx(isOpen ? null : idx)}
      >
        <p className="text-sm font-medium text-gray-800 flex-1">{q.question}</p>
        <span className="text-gray-400 flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1">🔍 What the interviewer is testing</p>
            <p className="text-sm text-blue-800">{q.what_interviewer_tests}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-purple-700 mb-1">⭐ How to answer (STAR)</p>
            <p className="text-sm text-purple-800">{q.answer_hint}</p>
          </div>
        </div>
      )}
    </div>
  )
}
