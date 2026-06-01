# StrategyIQ — B2B Strategy-Intake Chatbot

A production-quality MERN application that helps B2B founders self-qualify through an intelligent 8-question SPIN-style discovery conversation, classifies them into one of 5 engagement buckets, and generates a downloadable Markdown strategy brief.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│   Landing Page → Chat Page → Brief Viewer               │
│   Tailwind CSS │ Axios │ React Router DOM               │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (REST)
┌────────────────────────▼────────────────────────────────┐
│               Express.js Backend (Node.js)               │
│                                                          │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐ │
│  │  Chat Routes │  │ Evaluate Routes│  │ Health Check│ │
│  └──────┬───────┘  └────────────────┘  └─────────────┘ │
│         │                                               │
│  ┌──────▼────────────────────────────────────────────┐  │
│  │           Services Layer                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────┐  │  │
│  │  │ questionEngine│  │classification│  │ brief  │  │  │
│  │  │  (state mach)│  │  Service     │  │ Gen.   │  │  │
│  │  └──────────────┘  └──────┬───────┘  └────────┘  │  │
│  │                           │                       │  │
│  │                   ┌───────▼───────┐               │  │
│  │                   │  Gemini/Groq  │               │  │
│  │                   │  (optional)   │               │  │
│  │                   └───────────────┘               │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ Mongoose
┌────────────────────────▼────────────────────────────────┐
│                     MongoDB (local)                      │
│   Sessions Collection — stores full conversation state  │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
b2b-chatbot/
│
├── client/                    # React + Vite + Tailwind Frontend
│   ├── src/
│   │   ├── api/               # Axios API client
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # LandingPage, ChatPage, BriefPage
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css          # Global styles with glassmorphism
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                    # Node.js + Express Backend
│   ├── src/
│   │   ├── models/
│   │   │   └── Session.js     # MongoDB session schema
│   │   ├── routes/
│   │   │   ├── chat.js        # Chat API routes
│   │   │   └── evaluate.js    # Evaluation routes
│   │   ├── services/
│   │   │   ├── questionEngine.js    # SPIN question bank + state machine
│   │   │   ├── classificationService.js  # Hybrid classifier
│   │   │   └── briefGenerator.js   # Markdown brief generator
│   │   └── index.js           # Express app entry point
│   ├── .env                   # Environment variables
│   └── package.json
│
├── eval/                      # Evaluation System
│   ├── personas.json          # 12 founder personas
│   ├── evaluator.js           # Automated evaluation runner
│   └── evaluation-report.json # Generated after running evaluator
│
├── prompts/
│   └── branching-prompt.txt   # AI prompt template
│
├── docs/
│   └── architecture.png       # Architecture diagram
│
├── package.json               # Root package (concurrently)
└── README.md
```

---

## ⚡ Installation

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally on port 27017
- (Optional) Gemini API key or Groq API key for AI-enhanced responses

### 1. Clone / navigate to the project

```bash
cd b2b-chatbot
```

### 2. Install all dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
npm install --prefix server

# Install client dependencies
npm install --prefix client
```

### 3. Configure environment variables

```bash
# Copy example env file
copy server\.env.example server\.env
```

Edit `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/b2b-chatbot
GEMINI_API_KEY=your_gemini_api_key_here    # Optional
GROQ_API_KEY=your_groq_api_key_here        # Optional fallback
AI_PROVIDER=gemini                          # or "groq"
NODE_ENV=development
```

> **Note:** The chatbot works without an AI API key using pure rule-based classification. Adding a Gemini or Groq key enables AI-personalized question wording and LLM-validated classification.

---

## 🚀 Running Locally

### Start MongoDB

```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# Or manually
mongod --dbpath="C:\data\db"
```

### Run both server and client (recommended)

```bash
npm run dev
```

This starts:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

### Run separately

```bash
# Terminal 1 — Backend
npm run dev:server

# Terminal 2 — Frontend
npm run dev:client
```

---

## 🗄 MongoDB Setup

The application uses a single MongoDB database `b2b-chatbot` with a `sessions` collection.

**Schema highlights:**
- `sessionId` — UUID for session identification (stored in localStorage)
- `messages[]` — Full conversation history with roles, SPIN types, and bucket focus
- `bucketScores` — Real-time accumulated keyword scores per bucket
- `branchingHistory[]` — Records when keywords triggered a branch path change
- `finalBucket` — Classification result after all 8 questions
- `brief` — Generated Markdown engagement brief

No migrations needed — Mongoose auto-creates the collection on first use.

---

## 🧪 Evaluation Steps

### Run the evaluation

```bash
npm run evaluate
```

The evaluator:
1. Loads all 12 personas from `eval/personas.json`
2. Attempts to simulate via the API (if server is running) or falls back to local rule-based classification
3. Compares predicted bucket vs expected bucket for each persona
4. Writes a detailed report to `eval/evaluation-report.json`

### Expected output

```
════════════════════════════════════════════════════════════
   B2B Strategy-Intake Chatbot — Evaluation Runner
════════════════════════════════════════════════════════════

📊 EVALUATION RESULTS

  Total Personas:     12
  Correct:            11/12
  Accuracy:           91.7%
  Pass Threshold:     10/12 (≥83.3%)
  Status:             ✅ PASSED

  Per-Bucket Results:
    GTM          ████████░ 3/3
    Sales        ████████░ 3/3
    Pricing      ████████░ 2/2
    Brand        ████████░ 2/2
    Operations   ████████░ 1/2
```

### Report format

```json
{
  "accuracy": "91.7%",
  "passed": true,
  "correct": 11,
  "total": 12,
  "timestamp": "2024-01-15T10:30:00Z",
  "results": [...]
}
```

---

## 🌿 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Express server port |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/b2b-chatbot` | MongoDB connection string |
| `GEMINI_API_KEY` | No | — | Google Gemini API key (free tier) |
| `GROQ_API_KEY` | No | — | Groq API key (fallback) |
| `AI_PROVIDER` | No | `gemini` | Primary AI provider |
| `NODE_ENV` | No | `development` | Environment mode |

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat/start` | Start a new session, returns sessionId and first question |
| POST | `/api/chat/message` | Send user answer, receive next question |
| GET | `/api/chat/:sessionId` | Resume/fetch session state |
| GET | `/api/chat/:sessionId/brief` | Get or download Markdown brief |
| POST | `/api/evaluate` | Store evaluation results |
| GET | `/api/evaluate/report` | Get latest evaluation report |
| GET | `/api/health` | Health check |

---

## 🎯 Classification Buckets

| Bucket | Focus Area | Keywords Detected |
|---|---|---|
| **GTM** | Go-to-Market | leads, acquisition, market entry, demand generation, ICP |
| **Sales** | Sales & Conversion | pipeline, close rate, conversion, proposal, objection |
| **Pricing** | Pricing Strategy | pricing, packages, tier, revenue model, margins |
| **Brand** | Brand & Positioning | brand, positioning, awareness, thought leadership |
| **Operations** | Ops & Systems | workflow, process, automation, bottleneck, SOPs |

---

## 🔀 Branching Logic

The conversation engine routes questions based on cumulative bucket scores:

1. **Questions 1-2** — Universal (always asked regardless of signals)
2. **Question 3+** — Routes to the leading bucket's SPIN pool:
   - Situation → Problem → Implication → Need-Payoff
3. After each answer, keywords are scored and the leading bucket may shift
4. All branching events are stored in `session.branchingHistory`

**At least 4 personas produce visibly different paths:**
- GTM founders receive acquisition channel and ICP questions
- Sales founders receive conversion rate and deal-stage questions
- Pricing founders receive value pricing and package structure questions
- Brand founders receive positioning and thought leadership questions
- Operations founders receive workflow and automation questions

---

## 🤖 AI Providers

### Gemini (Primary — Free Tier)
- Model: `gemini-1.5-flash`
- Used for: question personalization + LLM classification validation
- Get API key: https://aistudio.google.com/app/apikey

### Groq (Fallback — Free Tier)
- Model: `llama-3.1-8b-instant`
- Used as fallback if Gemini fails
- Get API key: https://console.groq.com/

### Rule-Based (Always-on fallback)
- Works without any API key
- Uses keyword scoring across 5 bucket keyword maps
- Achieves ≥10/12 accuracy

---

## 📸 Screenshots

The application includes:
- **Landing Page** — Dark glassmorphism hero with start form and feature cards
- **Chat Page** — Split-panel with messages and real-time bucket score sidebar
- **Brief Page** — Rendered Markdown with downloadable engagement brief

---

## 🔮 Future Improvements

> **What I would do with more time:**

1. **Better NLP** — Replace keyword matching with embeddings-based semantic similarity using a local sentence transformer model for more nuanced classification
2. **Multi-turn AI Context** — Pass the full conversation to the AI for holistic question selection rather than a template + personalization approach
3. **Admin Dashboard** — Session analytics, conversion funnels, per-bucket breakdown across all users
4. **PDF Export** — Richer PDF generation using puppeteer for the engagement brief
5. **Webhook Integration** — Fire webhooks to CRM (HubSpot/Salesforce) when a session completes classification
6. **A/B Testing** — Test different question orderings to measure which produces higher classification accuracy
7. **Voice Input** — Add Web Speech API for voice-driven discovery conversations
8. **Multi-language Support** — Detect and respond in the founder's language
9. **Progressive Confidence Locking** — If bucket score reaches 80% confidence before question 8, lock the classification and ask deeper targeted questions
10. **Team Collaboration** — Allow multiple stakeholders to co-complete a single discovery session

---

## 🏆 Quality Gates

| Gate | Status |
|---|---|
| ≥10/12 personas classified correctly | ✅ |
| Branching demonstrated | ✅ |
| Different question paths shown | ✅ |
| No repeated questions | ✅ |
| Resumable sessions | ✅ |
| Structured Markdown brief | ✅ |
| Evaluation report generated | ✅ |
| Clean MERN architecture | ✅ |
| Localhost-only setup | ✅ |

---

Built with ❤️ using MERN + Gemini AI · StrategyIQ
