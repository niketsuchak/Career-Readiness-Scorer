import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Analyzer from './pages/Analyzer'
import Results from './pages/Results'
import History from './pages/History'
import AssessmentSetup from './pages/AssessmentSetup'
import AssessmentChat from './pages/AssessmentChat'
import AssessmentResults from './pages/AssessmentResults'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<Analyzer />} />
        <Route path="/results" element={<Results />} />
        <Route path="/history" element={<History />} />
        <Route path="/assessment" element={<AssessmentSetup />} />
        <Route path="/assessment/chat" element={<AssessmentChat />} />
        <Route path="/assessment/results" element={<AssessmentResults />} />
      </Routes>
    </div>
  )
}
