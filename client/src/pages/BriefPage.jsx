import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { chatAPI } from '../api/chatApi'

const BUCKET_COLORS = {
  GTM: 'bucket-GTM',
  Sales: 'bucket-Sales',
  Pricing: 'bucket-Pricing',
  Brand: 'bucket-Brand',
  Operations: 'bucket-Operations'
}

const BUCKET_ICONS = {
  GTM: '🚀',
  Sales: '💰',
  Pricing: '🏷️',
  Brand: '✨',
  Operations: '⚙️'
}

export default function BriefPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [brief, setBrief] = useState('')
  const [finalBucket, setFinalBucket] = useState(null)
  const [confidence, setConfidence] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadBrief()
  }, [sessionId])

  const loadBrief = async () => {
    try {
      setLoading(true)
      const res = await chatAPI.getBrief(sessionId)
      setBrief(res.data.brief)
      setFinalBucket(res.data.finalBucket)
      setConfidence(res.data.confidence)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load the strategy brief.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const res = await chatAPI.downloadBrief(sessionId)
      const blob = new Blob([res.data], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `strategy-brief-${sessionId.substring(0, 8)}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      // Fallback: download raw text
      if (brief) {
        const blob = new Blob([brief], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `strategy-brief-${sessionId.substring(0, 8)}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(brief)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      // fallback
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Generating your strategy brief...</p>
          <p className="text-slate-600 text-sm mt-1">Analyzing conversation and classifying...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Brief Not Ready</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/chat', { state: { sessionId, resuming: true } })}
              className="btn-primary"
              id="continue-chat-btn"
            >
              Continue Conversation
            </button>
            <button
              onClick={() => navigate('/')}
              className="glass border border-white/10 text-slate-300 hover:text-white px-5 py-3 rounded-xl text-sm"
            >
              Start New
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="glass-dark sticky top-0 z-50 px-6 py-4 border-b border-white/5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/chat', { state: { sessionId, resuming: true } })}
              className="text-slate-400 hover:text-white transition-colors"
              id="back-to-chat-btn"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="font-bold text-white text-sm">Strategy Engagement Brief</h1>
              {finalBucket && (
                <div className={`inline-flex items-center gap-1.5 text-xs mt-0.5 px-2 py-0.5 rounded-full border ${BUCKET_COLORS[finalBucket]}`}>
                  {BUCKET_ICONS[finalBucket]} {finalBucket}
                  {confidence && ` · ${confidence}% confidence`}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-brief-btn"
              onClick={handleCopy}
              className="glass hover:bg-white/10 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2"
            >
              {copied ? (
                <><svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied!</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
              )}
            </button>
            <button
              id="download-brief-btn"
              onClick={handleDownload}
              className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download .md
            </button>
          </div>
        </div>
      </header>

      {/* Brief Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Classification Banner */}
        {finalBucket && (
          <div className={`glass rounded-2xl p-6 mb-8 border ${BUCKET_COLORS[finalBucket]} animate-slide-up`}>
            <div className="flex items-center gap-4">
              <div className="text-5xl">{BUCKET_ICONS[finalBucket]}</div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Your Primary Strategy Focus</p>
                <h2 className="text-2xl font-bold text-white">{finalBucket}</h2>
                {confidence && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-1.5 w-32 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 progress-fill"
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{confidence}% confidence</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Markdown Brief */}
        <div className="glass rounded-2xl p-8 markdown-content">
          <ReactMarkdown>{brief}</ReactMarkdown>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <button
            id="download-brief-bottom-btn"
            onClick={handleDownload}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Strategy Brief
          </button>
          <button
            id="new-session-brief-btn"
            onClick={() => { localStorage.removeItem('chatSessionId'); navigate('/') }}
            className="glass border border-white/10 text-slate-300 hover:text-white px-5 py-3 rounded-xl text-sm font-medium transition-all"
          >
            Start New Session
          </button>
        </div>
      </main>
    </div>
  )
}
