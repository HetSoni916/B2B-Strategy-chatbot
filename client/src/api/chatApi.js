import axios from 'axios'

// In production (Vercel): uses VITE_API_URL env variable
// In local dev: uses Vite proxy which forwards /api → localhost:5000
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

export const chatAPI = {
  start: (founderName, companyName) =>
    api.post('/chat/start', { founderName, companyName }),

  sendMessage: (sessionId, message) =>
    api.post('/chat/message', { sessionId, message }),

  getSession: (sessionId) =>
    api.get(`/chat/${sessionId}`),

  getBrief: (sessionId, download = false) =>
    api.get(`/chat/${sessionId}/brief${download ? '?download=true' : ''}`),

  downloadBrief: (sessionId) =>
    api.get(`/chat/${sessionId}/brief?download=true`, { responseType: 'blob' })
}

export const evaluateAPI = {
  getReport: () => api.get('/evaluate/report')
}

export default api
