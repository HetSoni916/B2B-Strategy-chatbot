const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const chatRoutes = require('./routes/chat');
const evaluateRoutes = require('./routes/evaluate');

const app = express();

// ── CORS ─────────────────────────────────────────────────
// Allow localhost dev + any Vercel deployment URL
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  /\.vercel\.app$/,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser requests
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
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: process.env.NODE_ENV || 'development'
  });
});

// Root API status
app.get('/api', (req, res) => {
  res.json({
    service: 'B2B Strategy-Intake Chatbot API',
    version: '1.0.0',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected — set MONGODB_URI in environment variables'
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

// ── MongoDB connection ────────────────────────────────────
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/b2b-chatbot',
      { serverSelectionTimeoutMS: 5000 }
    );
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // Don't exit in serverless — let the request fail gracefully
    if (process.env.NODE_ENV !== 'production') process.exit(1);
  }
};

// ── Start ─────────────────────────────────────────────────
// In local dev: connect then listen
// In Vercel serverless: connect per cold-start, export app
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 AI Provider: ${process.env.AI_PROVIDER || 'gemini'}`);
    });
  });
} else {
  // Serverless: connect on first request
  connectDB();
}

module.exports = app;
