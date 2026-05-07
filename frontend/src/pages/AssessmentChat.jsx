import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { submitAnswer, completeAssessment } from '../services/api'

const levelColors = {
  expert:      'bg-green-100 text-green-700 border-green-200',
  proficient:  'bg-blue-100 text-blue-700 border-blue-200',
  familiar:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  beginner:    'bg-orange-100 text-orange-700 border-orange-200',
  no_knowledge:'bg-red-100 text-red-700 border-red-200',
}

export default function AssessmentChat() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const bottomRef = useRef(null)

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [currentQ, setCurrentQ] = useState(1)
  const [totalQ, setTotalQ] = useState(0)
  const [scores, setScores] = useState([])
  const [completed, setCompleted] = useState(false)
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    if (!state?.session) { navigate('/assessment'); return }
    const s = state.session
    setSessionId(s.session_id)
    setTotalQ(s.total_questions)

    const msgs = []
    if (s.intro_message) {
      msgs.push({ role: 'agent', text: s.intro_message })
    }
    msgs.push({
      role: 'agent',
      text: s.question,
      skill: s.skill,
      questionNumber: 1,
      total: s.total_questions,
    })
    setMessages(msgs)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const answer = input.trim()
    setInput('')
    setLoading(true)

    setMessages(prev => [...prev, { role: 'user', text: answer }])

    try {
      const { data } = await submitAnswer({ session_id: sessionId, answer })

      // Score feedback bubble
      setMessages(prev => [...prev, {
        role: 'score',
        skill: data.skill_assessed,
        score: data.proficiency_score,
        level: data.proficiency_level,
        reasoning: data.score_reasoning,
      }])

      setScores(prev => [...prev, {
        skill: data.skill_assessed,
        proficiency_score: data.proficiency_score,
        proficiency_level: data.proficiency_level,
        score_reasoning: data.score_reasoning,
      }])

      if (data.completed) {
        setCompleted(true)
        setMessages(prev => [...prev, {
          role: 'agent',
          text: "Great job completing the assessment! 🎉 I've evaluated all your skills. Click below to generate your personalised learning plan.",
        }])
      } else {
        // Transition + next question
        if (data.transition_message) {
          setMessages(prev => [...prev, { role: 'agent', text: data.transition_message }])
        }
        setMessages(prev => [...prev, {
          role: 'agent',
          text: data.next_question,
          skill: data.next_skill,
          questionNumber: data.next_question_number,
          total: data.total_questions,
        }])
        setCurrentQ(data.next_question_number)
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'agent',
        text: '⚠️ Something went wrong. Please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    setFinishing(true)
    try {
      const { data } = await completeAssessment({ session_id: sessionId })
      navigate('/assessment/results', { state: { report: data } })
    } catch (err) {
      setMessages(prev => [...prev, { role: 'agent', text: '⚠️ Failed to generate report. Please try again.' }])
      setFinishing(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (!state?.session) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-16 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <span>🤖</span> AI Skill Assessment
              <span className="text-xs font-normal text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full ml-1">
                Groq · llama-3.3-70b
              </span>
            </h2>
            <p className="text-sm text-gray-500">{state.session.target_role}</p>
          </div>
          {/* Progress */}
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Question {Math.min(currentQ, totalQ)} of {totalQ}</p>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(Math.min(currentQ, totalQ) / totalQ) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Skills overview pills */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="max-w-3xl mx-auto flex gap-2 flex-wrap">
          {state.session.skills_overview?.map((skill, i) => {
            const scored = scores.find(s => s.skill.toLowerCase() === skill.toLowerCase())
            return (
              <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${scored ? levelColors[scored.proficiency_level] || 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                {scored ? `✓ ` : ''}{skill}
                {scored ? ` · ${scored.proficiency_score}` : ''}
              </span>
            )
          })}
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'agent' && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">🤖</div>
                  <div className="flex-1">
                    {msg.skill && msg.questionNumber && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                          Q{msg.questionNumber}/{msg.total} · {msg.skill}
                        </span>
                      </div>
                    )}
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 shadow-sm">
                      {msg.text}
                    </div>
                  </div>
                </div>
              )}

              {msg.role === 'user' && (
                <div className="flex justify-end">
                  <div className="bg-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm max-w-lg shadow-sm">
                    {msg.text}
                  </div>
                </div>
              )}

              {msg.role === 'score' && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">📊</div>
                  <div className={`border rounded-xl px-4 py-3 text-sm ${levelColors[msg.level] || 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{msg.skill}</span>
                      <span className="font-bold text-lg">{msg.score}/100</span>
                      <span className="capitalize text-xs font-medium px-2 py-0.5 bg-white/60 rounded-full border">{msg.level?.replace('_', ' ')}</span>
                    </div>
                    <p className="text-xs opacity-80">{msg.reasoning}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">🤖</div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-5">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input or Complete button */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 sticky bottom-0">
        <div className="max-w-3xl mx-auto">
          {completed ? (
            <button
              onClick={handleComplete}
              disabled={finishing}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {finishing ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating your personalised learning plan...
                </>
              ) : '🗺️ Generate My Learning Plan →'}
            </button>
          ) : (
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
                rows={2}
                disabled={loading}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:bg-gray-50"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-5 rounded-xl font-medium transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : '→'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
