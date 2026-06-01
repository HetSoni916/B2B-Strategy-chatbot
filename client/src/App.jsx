import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ChatPage from './pages/ChatPage'
import BriefPage from './pages/BriefPage'

function App() {
  return (
    <div className="min-h-screen bg-animated">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/brief/:sessionId" element={<BriefPage />} />
      </Routes>
    </div>
  )
}

export default App
