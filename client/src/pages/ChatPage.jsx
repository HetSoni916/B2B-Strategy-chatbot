import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { chatAPI } from '../api/chatApi'

const BUCKET_COLORS = {
  GTM: 'bg-cyan-500',
  Sales: 'bg-emerald-500',
  Pricing: 'bg-amber-500',
  Brand: 'bg-pink-500',
  Operations: 'bg-indigo-500'
}

const BUCKET_TEXT = {
  GTM: 'text-cyan-400',
  Sales: 'text-emerald-400',
  Pricing: 'text-amber-400',
  Brand: 'text-pink-400',
  Operations: 'text-indigo-400'
}

const SPIN_LABELS = {
  Situation: { color: 'bg-blue-500/20 text-blue-300', icon: '📋' },
  Problem: { color: 'bg-red-500/20 text-red-300', icon: '⚡' },
  Implication: { color: 'bg-amber-500/20 text-amber-300', icon: '🔍' },
  NeedPayoff: { color: 'bg-emerald-500/20 text-emerald-300', icon: '🎯' }
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4 message-bubble">
      <div className="w-9 h-9 rounded-xl bg-primary-600 flex-shrink-0 flex items-center justify-center glow-primary">
        <span className="text-white text-sm font-bold">AI</span>
      </div>
      <div className="glass rounded-2xl rounded-bl-sm px-5 py-4">
        <div className="flex gap-1.5 items-center h-5">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg, index }) {
  const isAI = msg.role === 'assistant'
  const spinInfo = msg.questionType ? SPIN_LABELS[msg.questionType] : null

  return (
    <div
      className={`flex items-end gap-3 mb-4 message-bubble ${isAI ? '' : 'flex-row-reverse'}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {isAI ? (
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex-shrink-0 flex items-center justify-center glow-primary">
          <span className="text-white text-sm font-bold">AI</span>
        </div>
      ) : (
        <div className="w-9 h-9 rounded-xl bg-slate-700 flex-shrink-0 flex items-center justify-center">
          <span className="text-slate-300 text-sm font-bold">You</span>
        </div>
      )}

      <div className={`max-w-[75%] ${isAI ? '' : 'items-end'} flex flex-col gap-1`}>
        {isAI && spinInfo && (
          <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${spinInfo.color}`}>
            {spinInfo.icon} {msg.questionType === 'NeedPayoff' ? 'Need-Payoff' : msg.questionType}
            {msg.bucketFocus && ` · ${msg.bucketFocus}`}
          </span>
        )}
        <div className={`
          rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isAI
            ? 'glass rounded-bl-sm text-slate-200'
            : 'bg-primary-600/90 rounded-br-sm text-white'}
        `}>
          {msg.content}
        </div>
      </div>
    </div>
  )
}

function BucketScorePanel({ scores, leading }) {
  const buckets = ['GTM', 'Sales', 'Pricing', 'Brand', 'Operations']
  const maxScore = Math.max(...Object.values(scores), 1)

  return (
    <div className="glass-dark rounded-xl p-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Signal Strength</h3>
      <div className="space-y-2">
        {buckets.map(bucket => {
          const score = scores[bucket] || 0
          const pct = Math.round((score / maxScore) * 100)
          const isLeading = bucket === leading

          return (
            <div key={bucket} className="flex items-center gap-2">
              <span className={`text-xs w-20 font-medium ${isLeading ? BUCKET_TEXT[bucket] : 'text-slate-500'}`}>
                {isLeading && '▶ '}{bucket}
              </span>
              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full score-bar ${BUCKET_COLORS[bucket]}`}
                  style={{ width: `${pct}%`, opacity: isLeading ? 1 : 0.5 }}
                />
              </div>
              <span className="text-xs text-slate-500 w-6 text-right">{score}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bucketScores, setBucketScores] = useState({ GTM: 0, Sales: 0, Pricing: 0, Brand: 0, Operations: 0 })
  const [leadingBucket, setLeadingBucket] = useState(null)
  const [progress, setProgress] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [completed, setCompleted] = useState(false)
  const [finalBucket, setFinalBucket] = useState(null)
  const [error, setError] = useState('')
  const [resuming, setResuming] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Initialize session
  useEffect(() => {
    const { sessionId: stateSessionId, firstMessage, resuming: isResuming } = location.state || {}

    if (stateSessionId) {
      setSessionId(stateSessionId)
      if (isResuming) {
        loadSession(stateSessionId)
      } else if (firstMessage) {
        // Fresh session — add the first message
        setMessages([{
          role: 'assistant',
          content: firstMessage,
          questionType: 'Situation',
          bucketFocus: null,
          questionIndex: 0,
          timestamp: new Date()
        }])
        setQuestionNumber(1)
        inputRef.current?.focus()
      }
    } else {
      // No state — check localStorage
      const storedId = localStorage.getItem('chatSessionId')
      if (storedId) {
        setSessionId(storedId)
        loadSession(storedId)
      } else {
        navigate('/')
      }
    }
  }, [])

  const loadSession = async (sid) => {
    try {
      setResuming(true)
      const res = await chatAPI.getSession(sid)
      const session = res.data

      setMessages(session.messages || [])
      setBucketScores(session.bucketScores || {})
      setProgress(session.progress || 0)
      setQuestionNumber(session.questionsAnswered + 1)

      if (session.status === 'classified') {
        setCompleted(true)
        setFinalBucket(session.finalBucket)
        setProgress(100)
      }

      const leading = Object.entries(session.bucketScores || {}).sort((a, b) => b[1] - a[1])[0]?.[0]
      setLeadingBucket(leading)
    } catch (err) {
      setError('Failed to resume session. Starting fresh.')
      setTimeout(() => navigate('/'), 2000)
    } finally {
      setResuming(false)
    }
  }

  const sendMessage = async () => {
    if (!inputText.trim() || loading || !sessionId) return

    const userMessage = {
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setLoading(true)
    setIsTyping(true)

    try {
      const res = await chatAPI.sendMessage(sessionId, inputText.trim())
      const data = res.data

      setIsTyping(false)

      if (data.bucketScores) {
        setBucketScores(data.bucketScores)
        const leading = Object.entries(data.bucketScores).sort((a, b) => b[1] - a[1])[0]?.[0]
        setLeadingBucket(data.leadingBucket || leading)
      }

      if (data.progress !== undefined) setProgress(data.progress)

      if (data.completed) {
        setCompleted(true)
        setFinalBucket(data.finalBucket)
        setProgress(100)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          questionType: data.questionType,
          bucketFocus: data.bucketFocus,
          questionIndex: data.questionNumber,
          timestamp: new Date()
        }])
        setQuestionNumber(data.questionNumber || questionNumber + 1)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    } catch (err) {
      setIsTyping(false)
      setError('Failed to send message. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const viewBrief = () => {
    navigate(`/brief/${sessionId}`)
  }

  const startNew = () => {
    localStorage.removeItem('chatSessionId')
    navigate('/')
  }

  if (resuming) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Resuming your conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col max-w-6xl mx-auto px-4">
      {/* Header */}
      <header className="flex items-center justify-between py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="font-bold text-white">Strategy Discovery</h1>
            <p className="text-xs text-slate-500">
              {completed ? 'Complete ✓' : `Question ${Math.min(questionNumber, 8)} of 8`}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-500">{progress}%</span>
            <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="progress-fill h-full rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
          {leadingBucket && !completed && (
            <div className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              `bucket-${leadingBucket}`
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${BUCKET_COLORS[leadingBucket]} animate-pulse`}></div>
              {leadingBucket}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 gap-4 py-4 overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-1">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                Loading conversation...
              </div>
            )}
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} index={i} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Completed State */}
          {completed && (
            <div className="mt-4 p-5 glass rounded-2xl text-center animate-fade-in">
              <div className="text-3xl mb-3">🎉</div>
              <h2 className="text-lg font-bold text-white mb-2">Discovery Complete!</h2>
              <p className="text-slate-400 text-sm mb-4">
                You've been classified as <strong className={BUCKET_TEXT[finalBucket]}>{finalBucket}</strong>
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  id="view-brief-btn"
                  onClick={viewBrief}
                  className="btn-primary flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Strategy Brief
                </button>
                <button
                  id="start-new-btn"
                  onClick={startNew}
                  className="glass border border-white/10 text-slate-300 hover:text-white px-5 py-3 rounded-xl text-sm font-medium transition-all"
                >
                  Start New Session
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          {!completed && (
            <div className="mt-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1 glass rounded-2xl px-4 py-3">
                  <textarea
                    ref={inputRef}
                    id="chat-input"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Share your thoughts... (Enter to send, Shift+Enter for new line)"
                    className="w-full bg-transparent text-white placeholder-slate-500 text-sm resize-none chat-input outline-none max-h-32"
                    rows={2}
                    disabled={loading}
                  />
                </div>
                <button
                  id="send-message-btn"
                  onClick={sendMessage}
                  disabled={loading || !inputText.trim()}
                  className="w-12 h-12 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all glow-primary flex-shrink-0"
                  aria-label="Send message"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
              {error && (
                <p className="text-red-400 text-xs mt-2 px-1">{error}</p>
              )}
              <p className="text-slate-600 text-xs mt-2 px-1">
                Your responses are analyzed in real-time to guide the next question
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:flex flex-col gap-4 w-56 flex-shrink-0">
          {/* Progress */}
          <div className="glass-dark rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Progress</h3>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
              <div className="progress-fill h-full rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-slate-400">{progress}% complete</p>
            {!completed && (
              <p className="text-xs text-slate-500 mt-1">
                Question {Math.min(questionNumber, 8)} of 8
              </p>
            )}
          </div>

          {/* Bucket Scores */}
          <BucketScorePanel scores={bucketScores} leading={leadingBucket} />

          {/* SPIN Framework Info */}
          <div className="glass-dark rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">SPIN Framework</h3>
            <div className="space-y-2">
              {Object.entries(SPIN_LABELS).map(([type, info]) => (
                <div key={type} className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${info.color}`}>
                  <span>{info.icon}</span>
                  <span>{type === 'NeedPayoff' ? 'Need-Payoff' : type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Session ID */}
          {sessionId && (
            <div className="glass-dark rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Session ID</p>
              <p className="text-xs text-slate-400 font-mono break-all">{sessionId.substring(0, 16)}...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
