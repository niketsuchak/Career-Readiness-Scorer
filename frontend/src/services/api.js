import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8000' })

export const analyzeProfile = (profile) => api.post('/analyze', profile)
export const getHistory = () => api.get('/history')
export const clearHistory = () => api.delete('/history')
export const checkHealth = () => api.get('/health')
export const parseResume = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/parse-resume', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// Assessment agent
export const startAssessment = (data) => api.post('/assessment/start', data)
export const submitAnswer = (data) => api.post('/assessment/answer', data)
export const completeAssessment = (data) => api.post('/assessment/complete', data)
export const getInterviewQuestions = (data) => api.post('/assessment/interview-questions', data)
