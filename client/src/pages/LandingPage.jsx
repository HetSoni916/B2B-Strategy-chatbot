import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { chatAPI } from '../api/chatApi'

const FEATURES = [
  { icon: '🎯', title: '8 SPIN Questions', desc: 'Situation, Problem, Implication, Need-Payoff framework' },
  { icon: '🔀', title: 'Dynamic Branching', desc: 'Questions adapt based on your previous answers' },
  { icon: '🧠', title: 'AI Classification', desc: 'Hybrid rule-based + LLM classifies you into 1 of 5 buckets' },
  { icon: '📄', title: 'Strategy Brief', desc: 'Downloadable Markdown engagement brief with next steps' },
]

const BUCKETS = [
  { name: 'GTM', color: 'bucket-GTM', desc: 'Go-to-Market Strategy' },
  { name: 'Sales', color: 'bucket-Sales', desc: 'Sales & Conversion' },
  { name: 'Pricing', color: 'bucket-Pricing', desc: 'Pricing Strategy' },
  { name: 'Brand', color: 'bucket-Brand', desc: 'Brand & Positioning' },
  { name: 'Operations', color: 'bucket-Operations', desc: 'Operations & Systems' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [founderName, setFounderName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStart = async (e) => {
    e.preventDefault()
    if (!founderName.trim()) {
      setError('Please enter your name to get started.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await chatAPI.start(founderName.trim(), companyName.trim())
      const { sessionId } = res.data
      localStorage.setItem('chatSessionId', sessionId)
      localStorage.setItem('founderName', founderName.trim())
      navigate('/chat', { state: { sessionId, firstMessage: res.data.message } })
    } catch (err) {
      setError('Could not connect to server. Make sure the backend is running on port 5000.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResume = () => {
    const sessionId = localStorage.getItem('chatSessionId')
    if (sessionId) {
      navigate('/chat', { state: { sessionId, resuming: true } })
    }
  }

  const hasSession = !!localStorage.getItem('chatSessionId')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="glass-dark sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center glow-primary">
              <span className="text-white font-bold text-sm">SQ</span>
            </div>
            <span className="font-bold text-lg text-white">StrategyIQ</span>
          </div>
          {hasSession && (
            <button
              onClick={handleResume}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-2"
              id="resume-session-btn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Resume Session
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-4xl w-full text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-sm text-slate-300">AI-Powered B2B Strategy Discovery</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">Find Your </span>
            <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-cyan-400 bg-clip-text text-transparent">
              Strategic Edge
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            8 intelligent SPIN questions. Dynamic branching. Instant classification into your primary growth lever — and a personalized strategy brief to take action.
          </p>

          {/* Start Form */}
          <div className="glass rounded-2xl p-8 max-w-md mx-auto mb-16 card-hover">
            <h2 className="text-xl font-semibold text-white mb-6 text-left">Start Your Discovery</h2>
            <form onSubmit={handleStart} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5" htmlFor="founder-name">
                  Your Name <span className="text-primary-400">*</span>
                </label>
                <input
                  id="founder-name"
                  type="text"
                  value={founderName}
                  onChange={e => setFounderName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 chat-input transition-all duration-200"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5" htmlFor="company-name">
                  Company Name <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 chat-input transition-all duration-200"
                />
              </div>
              {error && (
                <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <button
                type="submit"
                id="start-discovery-btn"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Starting...
                  </>
                ) : (
                  <>
                    Begin Discovery
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {FEATURES.map(f => (
              <div key={f.title} className="glass rounded-xl p-4 text-left card-hover">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="font-semibold text-white text-sm mb-1">{f.title}</div>
                <div className="text-slate-400 text-xs">{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Buckets */}
          <div>
            <p className="text-slate-500 text-sm mb-4">You'll be classified into one of 5 strategic buckets:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {BUCKETS.map(b => (
                <div
                  key={b.name}
                  className={`border rounded-full px-4 py-1.5 text-sm font-medium ${b.color}`}
                >
                  {b.name} · {b.desc}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-slate-600 text-sm">
        <p>StrategyIQ — B2B Founder Discovery · Built with MERN + Gemini AI</p>
      </footer>
    </div>
  )
}
