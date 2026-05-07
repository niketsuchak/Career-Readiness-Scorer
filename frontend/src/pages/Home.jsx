import { Link } from 'react-router-dom'

const features = [
  { icon: '🎯', title: 'Skill Match Analysis', desc: 'Compare your skills against role requirements and job descriptions.' },
  { icon: '📊', title: 'Multi-Dimensional Scoring', desc: 'Get scored on skills, projects, experience, resume strength, and certifications.' },
  { icon: '🗺️', title: 'Learning Roadmap', desc: 'Receive a personalized step-by-step roadmap to close skill gaps.' },
  { icon: '✍️', title: 'Resume Improvements', desc: 'Get actionable suggestions to strengthen your resume bullet points.' },
  { icon: '🏆', title: 'Readiness Level', desc: 'Know exactly where you stand: Beginner → Interview Ready.' },
  { icon: '📜', title: 'Analysis History', desc: 'Track your progress over time with saved analysis history.' },
]

const levels = [
  { range: '85–100', label: 'Interview Ready', color: 'bg-green-100 text-green-700 border-green-200' },
  { range: '70–84', label: 'Strong Candidate', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { range: '50–69', label: 'Needs Improvement', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { range: '0–49', label: 'Beginner Level', color: 'bg-red-100 text-red-700 border-red-200' },
]

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">🎯</div>
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            AI-Powered Career<br />Readiness Scorer
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Instantly analyze your student profile against any job role. Get a detailed score, identify gaps, and receive a personalized roadmap to land your dream job.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/assessment"
              className="bg-white text-purple-700 font-semibold px-8 py-3 rounded-xl hover:bg-purple-50 transition-colors shadow-lg border-2 border-white"
            >
              🤖 Start AI Assessment →
            </Link>
            <Link
              to="/analyze"
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Resume Analyzer
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What You Get</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring breakdown */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Scoring Breakdown</h2>
          <p className="text-center text-gray-600 mb-10">Your overall score is calculated from 5 weighted dimensions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Skill Match', weight: '35%', color: 'bg-blue-500' },
              { label: 'Projects', weight: '25%', color: 'bg-purple-500' },
              { label: 'Experience', weight: '20%', color: 'bg-green-500' },
              { label: 'Resume', weight: '10%', color: 'bg-orange-500' },
              { label: 'Certifications', weight: '10%', color: 'bg-pink-500' },
            ].map(({ label, weight, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className={`w-12 h-12 ${color} rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-sm`}>
                  {weight}
                </div>
                <p className="font-medium text-gray-800 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Readiness levels */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Readiness Levels</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {levels.map(({ range, label, color }) => (
              <div key={label} className={`rounded-xl border p-4 text-center ${color}`}>
                <p className="text-2xl font-bold mb-1">{range}</p>
                <p className="text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-purple-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to get assessed by AI?</h2>
        <p className="text-purple-100 mb-8">Upload your resume + job description. Our AI agent interviews you and builds a personalised learning plan.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/assessment"
            className="bg-white text-purple-700 font-semibold px-10 py-3 rounded-xl hover:bg-purple-50 transition-colors shadow-lg inline-block">
            🤖 Start AI Assessment →
          </Link>
          <Link to="/analyze"
            className="border-2 border-white text-white font-semibold px-10 py-3 rounded-xl hover:bg-white/10 transition-colors inline-block">
            Resume Analyzer
          </Link>
        </div>
      </section>
    </div>
  )
}
