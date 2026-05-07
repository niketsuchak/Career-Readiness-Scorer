import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeProfile, parseResume } from '../services/api'
import { SAMPLE_INPUT } from '../services/sampleData'

const EMPTY_FORM = {
  name: '', target_role: '', education: '', skills: '',
  projects: '', experience: '', certifications: '', job_description: ''
}

const fields = [
  { key: 'name', label: 'Student Name', placeholder: 'e.g. Alex Johnson', type: 'input', required: true },
  { key: 'target_role', label: 'Target Role', placeholder: 'e.g. Machine Learning Engineer', type: 'input', required: true },
  { key: 'education', label: 'Education', placeholder: 'Degree, university, GPA, relevant coursework...', type: 'textarea', rows: 2, required: true },
  { key: 'skills', label: 'Skills', placeholder: 'Python, TensorFlow, Docker, SQL, React...', type: 'textarea', rows: 2, required: true },
  { key: 'projects', label: 'Projects', placeholder: 'Describe your projects with tech stack and outcomes...', type: 'textarea', rows: 4, required: true },
  { key: 'experience', label: 'Work Experience', placeholder: 'Company, role, duration, key achievements...', type: 'textarea', rows: 4, required: false },
  { key: 'certifications', label: 'Certifications', placeholder: 'AWS Certified, Google ML Certificate...', type: 'textarea', rows: 2, required: false },
  { key: 'job_description', label: 'Job Description (optional)', placeholder: 'Paste the job description or key requirements...', type: 'textarea', rows: 4, required: false },
]

export default function Analyzer() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfParser, setPdfParser] = useState('')
  const [pdfError, setPdfError] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const handleChange = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.pdf')) {
      setPdfError('Please upload a PDF file.')
      return
    }
    setPdfFile(file)
    setPdfError('')
    setPdfLoading(true)
    try {
      const { data } = await parseResume(file)
      // Merge parsed fields — don't overwrite fields the user already filled
      // Prepend summary to education if present
      const educationVal = [data.summary, data.education].filter(Boolean).join('\n\n') || ''
      setPdfParser(data.parser || 'rule-based')
      setForm(prev => ({
        name:           data.name || prev.name,
        target_role:    data.target_role || prev.target_role,
        education:      educationVal || prev.education,
        skills:         data.skills || prev.skills,
        projects:       data.projects || prev.projects,
        experience:     data.experience || prev.experience,
        certifications: data.certifications || prev.certifications,
        job_description: prev.job_description,
      }))
    } catch (err) {
      setPdfError(err.response?.data?.detail || 'Failed to parse PDF. Try a text-based PDF.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await analyzeProfile(form)
      navigate('/results', { state: { result: data } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to connect to backend. Make sure the server is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Analyze Your Profile</h1>
          <p className="text-gray-600">Upload your resume or fill in your details manually.</p>
        </div>

        {/* PDF Upload Card */}
        <div
          className={`mb-6 border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer
            ${pdfLoading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'}`}
          onClick={() => !pdfLoading && fileInputRef.current.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handlePdfUpload}
          />
          {pdfLoading ? (
            <div className="flex items-center justify-center gap-3 text-blue-600">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="font-medium">Parsing resume...</span>
            </div>
          ) : pdfFile ? (
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">📄</span>
              <div className="text-left">
                <p className="font-medium text-gray-800 text-sm">{pdfFile.name}</p>
                <p className="text-xs text-green-600 font-medium">✓ Resume parsed via {pdfParser === 'groq' ? '🤖 Groq AI' : '📋 rule-based'} — fields auto-filled below</p>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setPdfFile(null); setPdfParser(''); setForm(EMPTY_FORM) }}
                className="ml-auto text-gray-400 hover:text-red-500 text-lg leading-none"
              >×</button>
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-2">📎</div>
              <p className="font-semibold text-gray-700">Upload Resume PDF</p>
              <p className="text-sm text-gray-500 mt-1">Click to browse · Auto-fills form fields</p>
            </div>
          )}
          {pdfError && <p className="text-red-600 text-sm mt-2">⚠️ {pdfError}</p>}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400 font-medium">or fill manually</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Sample data button */}
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => setForm(SAMPLE_INPUT)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            ⚡ Load Sample Input
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
          {fields.map(({ key, label, placeholder, type, rows, required }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              {type === 'input' ? (
                <input
                  type="text"
                  value={form[key]}
                  onChange={e => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  required={required}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              ) : (
                <textarea
                  value={form[key]}
                  onChange={e => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  required={required}
                  rows={rows}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
              )}
            </div>
          ))}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Analyzing Profile...
              </>
            ) : '🎯 Analyze My Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
