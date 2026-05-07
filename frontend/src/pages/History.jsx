import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getHistory, clearHistory } from '../services/api'

const resumeLevelColors = {
  'Interview Ready':  'bg-green-100 text-green-700',
  'Strong Candidate': 'bg-blue-100 text-blue-700',
  'Needs Improvement':'bg-orange-100 text-orange-700',
  'Beginner Level':   'bg-red-100 text-red-700',
}

const assessmentLevelColors = {
  'Expert':     'bg-green-100 text-green-700',
  'Proficient': 'bg-blue-100 text-blue-700',
  'Developing': 'bg-orange-100 text-orange-700',
  'Beginner':   'bg-red-100 text-red-700',
}

const readinessColors = {
  'Ready to interview':  'bg-green-100 text-green-700',
  '1 month away':        'bg-blue-100 text-blue-700',
  '2-3 months away':     'bg-orange-100 text-orange-700',
  '6+ months away':      'bg-red-100 text-red-700',
}

export default function History() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getHistory()
      .then(({ data }) => setRecords(data))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [])

  const handleClear = async () => {
    if (!confirm('Clear all history? This cannot be undone.')) return
    setClearing(true)
    await clearHistory()
    setRecords([])
    setClearing(false)
  }

  const isAssessment = (r) => r.type === 'assessment'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-gray-500">Loading history...</p>
        </div>
      </div>
    )
  }

  const resumeRecords = records.filter(r => !isAssessment(r))
  const assessmentRecords = records.filter(r => isAssessment(r))

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">History</h1>
            <p className="text-gray-500">{records.length} record{records.length !== 1 ? 's' : ''} saved</p>
          </div>
          {records.length > 0 && (
            <button
              onClick={handleClear}
              disabled={clearing}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {clearing ? 'Clearing...' : '🗑️ Clear All'}
            </button>
          )}
        </div>

        {records.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No history yet</h3>
            <p className="text-gray-500 mb-6">Complete an assessment or analyze a resume to see records here.</p>
            <div className="flex gap-3 justify-center">
              <Link to="/assessment" className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                🤖 Start Assessment
              </Link>
              <Link to="/analyze" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Resume Analyzer
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Assessment records */}
            {assessmentRecords.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>🤖</span> AI Assessments
                  <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{assessmentRecords.length}</span>
                </h2>
                <div className="space-y-3">
                  {assessmentRecords.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-xl border border-purple-100 p-5 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate('/assessment/results', { state: { report: r } })}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">🤖 AI Assessment</span>
                            {r.proficiency_level && (
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${assessmentLevelColors[r.proficiency_level] || 'bg-gray-100 text-gray-600'}`}>
                                {r.proficiency_level}
                              </span>
                            )}
                            {r.interview_readiness && (
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${readinessColors[r.interview_readiness] || 'bg-gray-100 text-gray-600'}`}>
                                🎯 {r.interview_readiness}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900">{r.student_name}</h3>
                          <p className="text-purple-600 font-medium text-sm">{r.target_role}</p>
                          {r.timestamp && (
                            <p className="text-gray-400 text-xs mt-1">{new Date(r.timestamp).toLocaleString()}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-3xl font-bold text-gray-900">{r.overall_proficiency_score}</div>
                          <div className="text-xs text-gray-500">/ 100</div>
                        </div>
                      </div>

                      {/* Skill scores */}
                      {r.skill_scores?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {r.skill_scores.map((s, i) => (
                            <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                              s.proficiency_level === 'expert'     ? 'bg-green-50 text-green-700 border-green-200' :
                              s.proficiency_level === 'proficient' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              s.proficiency_level === 'familiar'   ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {s.skill} · {s.proficiency_score}
                            </span>
                          ))}
                        </div>
                      )}


                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resume analysis records */}
            {resumeRecords.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>📄</span> Resume Analyses
                  <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{resumeRecords.length}</span>
                </h2>
                <div className="space-y-3">
                  {resumeRecords.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate('/results', { state: { result: r } })}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-lg">{r.student_name}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${resumeLevelColors[r.recommendation_level] || 'bg-gray-100 text-gray-600'}`}>
                              {r.recommendation_level}
                            </span>
                          </div>
                          <p className="text-blue-600 font-medium text-sm mb-1">{r.target_role}</p>
                          {r.timestamp && (
                            <p className="text-gray-400 text-xs">{new Date(r.timestamp).toLocaleString()}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-3xl font-bold text-gray-900">{r.scores?.overall_score}</div>
                          <div className="text-xs text-gray-500">/ 100</div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { label: 'Skills', val: r.scores?.skill_match },
                          { label: 'Projects', val: r.scores?.project_relevance },
                          { label: 'Experience', val: r.scores?.experience_relevance },
                          { label: 'Resume', val: r.scores?.resume_strength },
                          { label: 'Certs', val: r.scores?.certifications_score },
                        ].map(({ label, val }) => (
                          <div key={label} className="bg-gray-50 rounded-lg p-2 text-center">
                            <div className="text-sm font-semibold text-gray-800">{val}</div>
                            <div className="text-xs text-gray-500">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
