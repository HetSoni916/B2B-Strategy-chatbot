const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['assistant', 'user', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  questionType: {
    type: String,
    enum: ['Situation', 'Problem', 'Implication', 'NeedPayoff', null],
    default: null
  },
  bucketFocus: {
    type: String,
    enum: ['GTM', 'Sales', 'Pricing', 'Brand', 'Operations', null],
    default: null
  },
  questionIndex: {
    type: Number,
    default: null
  }
});

const BucketScoresSchema = new mongoose.Schema({
  GTM: { type: Number, default: 0 },
  Sales: { type: Number, default: 0 },
  Pricing: { type: Number, default: 0 },
  Brand: { type: Number, default: 0 },
  Operations: { type: Number, default: 0 }
}, { _id: false });

const BranchingEventSchema = new mongoose.Schema({
  questionIndex: Number,
  triggeredBy: String,
  detectedKeywords: [String],
  bucketSignal: String,
  scoresAtEvent: BucketScoresSchema
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  founderName: {
    type: String,
    default: ''
  },
  companyName: {
    type: String,
    default: ''
  },
  messages: [MessageSchema],
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  askedQuestionIds: {
    type: [String],
    default: []
  },
  bucketScores: {
    type: BucketScoresSchema,
    default: () => ({ GTM: 0, Sales: 0, Pricing: 0, Brand: 0, Operations: 0 })
  },
  branchingHistory: {
    type: [BranchingEventSchema],
    default: []
  },
  finalBucket: {
    type: String,
    enum: ['GTM', 'Sales', 'Pricing', 'Brand', 'Operations', null],
    default: null
  },
  finalConfidence: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'classified'],
    default: 'active'
  },
  brief: {
    type: String,
    default: null
  },
  personaId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Auto-update updatedAt
SessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Session', SessionSchema);
