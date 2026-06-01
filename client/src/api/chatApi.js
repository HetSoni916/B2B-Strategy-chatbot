import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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
