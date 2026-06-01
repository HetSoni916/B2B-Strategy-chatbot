const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { setMemoryMode, isMemoryMode } = require('./store/sessionStore');
const chatRoutes = require('./routes/chat');
const evaluateRoutes = require('./routes/evaluate');

const app = express();

// ── CORS ─────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  /\.vercel\.app$/,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────
app.use('/api/chat', chatRoutes);
app.use('/api/evaluate', evaluateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState === 1
    ? 'mongodb:connected'
    : isMemoryMode() ? 'memory:active' : 'disconnected';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: dbState,
    env: process.env.NODE_ENV || 'development'
  });
});

// Root API status
app.get('/api', (req, res) => {
  res.json({
    service: 'B2B Strategy-Intake Chatbot API',
    version: '1.0.0',
    storage: isMemoryMode() ? 'in-memory (demo mode)' : 'mongodb'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ── MongoDB connection (optional — falls back to memory store) ────────────────
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  // If no MONGODB_URI set in production, skip and use memory mode
  if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
    setMemoryMode(true);
    return;
  }

  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/b2b-chatbot',
      { serverSelectionTimeoutMS: 5000 }
    );
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    if (process.env.NODE_ENV === 'production') {
      // Fall back to memory store instead of crashing
      setMemoryMode(true);
    } else {
      process.exit(1);
    }
  }
};

// ── Start ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 AI Provider: ${process.env.AI_PROVIDER || 'gemini'}`);
    });
  });
} else {
  connectDB();
}

module.exports = app;
