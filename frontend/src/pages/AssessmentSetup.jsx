import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseResume, startAssessment } from '../services/api'

export default function AssessmentSetup() {
  const [name, setName] = useState('')
  const [jd, setJd] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const navigate = useNavigate()

  const handlePdf = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPdfFile(file)
    setPdfError('')
    setPdfLoading(true)
    try {
      const { data } = await parseResume(file)
      setResumeText(data.raw_text || '')
      if (!name && data.name) setName(data.name)
    } catch {
      setPdfError('Failed to parse PDF. You can paste resume text manually below.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleStart = async (e) => {
    e.preventDefault()
    if (!resumeText.trim()) { setError('Please upload a resume PDF or paste resume text.'); return }
    if (!jd.trim()) { setError('Please paste the job description.'); return }
    setError('')
    setLoading(true)
    try {
      const { data } = await startAssessment({ candidate_name: name, resume_text: resumeText, job_description: jd })
      navigate('/assessment/chat', { state: { session: data, resumeText, jd } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start assessment. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🤖</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">AI Skill Assessment</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Upload your resume and paste a job description. Our AI agent will conversationally assess your real proficiency on each required skill and generate a personalised learning plan.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { n: '1', label: 'Upload Resume + JD', icon: '📄' },
            { n: '2', label: 'AI Interviews You', icon: '💬' },
            { n: '3', label: 'Get Learning Plan', icon: '🗺️' },
          ].map(({ n, label, icon }) => (
            <div key={n} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-xs font-bold text-blue-600 mb-1">Step {n}</div>
              <div className="text-sm font-medium text-gray-700">{label}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleStart} className="space-y-6">
          {/* Name */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Resume Upload */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Resume <span className="text-red-500">*</span></label>
            <div
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors mb-4
                ${pdfLoading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
              onClick={() => !pdfLoading && fileRef.current.click()}
            >
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handlePdf} />
              {pdfLoading ? (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="text-sm font-medium">Parsing resume...</span>
                </div>
              ) : pdfFile ? (
                <div className="flex items-center justify-center gap-2">
                  <span>📄</span>
                  <span className="text-sm font-medium text-gray-700">{pdfFile.name}</span>
                  <span className="text-xs text-green-600 font-medium">✓ Parsed</span>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-1">📎</div>
                  <p className="text-sm font-medium text-gray-700">Click to upload Resume PDF</p>
                  <p className="text-xs text-gray-500 mt-1">Or paste text below</p>
                </div>
              )}
              {pdfError && <p className="text-red-500 text-xs mt-2">{pdfError}</p>}
            </div>
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Or paste your resume text here..."
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Job Description <span className="text-red-500">*</span></label>
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={7}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">⚠️ {error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Preparing your assessment...
              </>
            ) : '🤖 Start AI Assessment →'}
          </button>
        </form>
      </div>
    </div>
  )
}
