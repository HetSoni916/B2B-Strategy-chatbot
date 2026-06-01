const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Session = require('../models/Session');
const { selectNextQuestion, scoreAnswer } = require('../services/questionEngine');
const { classifyFounder, updateBucketScores, generateAIQuestion } = require('../services/classificationService');
const { generateBrief } = require('../services/briefGenerator');

const TOTAL_QUESTIONS = 8;

// ──────────────────────────────────────────────
// POST /api/chat/start
// Start a new conversation session
// ──────────────────────────────────────────────
router.post('/start', async (req, res) => {
  try {
    const sessionId = uuidv4();
    const { founderName, companyName } = req.body;

    const session = new Session({
      sessionId,
      founderName: founderName || '',
      companyName: companyName || '',
      messages: [],
      currentQuestionIndex: 0,
      askedQuestionIds: [],
      bucketScores: { GTM: 0, Sales: 0, Pricing: 0, Brand: 0, Operations: 0 },
      branchingHistory: [],
      status: 'active'
    });

    // Select and personalize the first question
    const { question } = selectNextQuestion(session);
    const questionText = question.text; // First question doesn't need AI personalization

    // Add assistant message
    session.messages.push({
      role: 'assistant',
      content: questionText,
      questionType: question.type,
      bucketFocus: null,
      questionIndex: 0
    });

    session.currentQuestionIndex = 1;
    session.askedQuestionIds.push(question.id);

    await session.save();

    res.json({
      success: true,
      sessionId,
      message: questionText,
      questionNumber: 1,
      totalQuestions: TOTAL_QUESTIONS,
      questionType: question.type,
      bucketScores: session.bucketScores,
      status: 'active'
    });
  } catch (err) {
    console.error('Start session error:', err);
    res.status(500).json({ error: 'Failed to start session', details: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/chat/message
// Send a message and receive next question
// ──────────────────────────────────────────────
router.post('/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'classified') {
      return res.json({
        success: true,
        sessionId,
        completed: true,
        finalBucket: session.finalBucket,
        message: `Your strategy brief is ready! You've been classified as needing **${session.finalBucket}** support.`,
        status: 'classified'
      });
    }

    // Add user message
    session.messages.push({
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    });

    // Update bucket scores based on this answer
    const { scores: newScores, foundKeywords } = scoreAnswer(message);
    const updatedScores = {
      GTM: session.bucketScores.GTM + newScores.GTM,
      Sales: session.bucketScores.Sales + newScores.Sales,
      Pricing: session.bucketScores.Pricing + newScores.Pricing,
      Brand: session.bucketScores.Brand + newScores.Brand,
      Operations: session.bucketScores.Operations + newScores.Operations
    };
    session.bucketScores = updatedScores;

    // Determine leading bucket BEFORE this answer (for branching detection)
    const leadingBucket = Object.entries(updatedScores).sort((a, b) => b[1] - a[1])[0][0];
    const totalKeywords = Object.values(newScores).reduce((a, b) => a + b, 0);

    // Record branching event if significant keywords detected
    if (totalKeywords > 0) {
      const detectedKws = Object.entries(foundKeywords)
        .flatMap(([bucket, kws]) => kws.map(kw => kw))
        .slice(0, 5);

      session.branchingHistory.push({
        questionIndex: session.currentQuestionIndex - 1,
        triggeredBy: message.substring(0, 100),
        detectedKeywords: detectedKws,
        bucketSignal: leadingBucket,
        scoresAtEvent: { ...updatedScores }
      });
    }

    // Check if conversation is complete (8 questions answered)
    const userMessageCount = session.messages.filter(m => m.role === 'user').length;

    if (userMessageCount >= TOTAL_QUESTIONS) {
      // CLASSIFY and generate brief
      const classificationResult = await classifyFounder(session);
      
      session.finalBucket = classificationResult.finalBucket;
      session.finalConfidence = classificationResult.confidence;
      session.status = 'classified';

      // Generate the engagement brief
      const brief = generateBrief(session, classificationResult);
      session.brief = brief;

      await session.save();

      return res.json({
        success: true,
        sessionId,
        completed: true,
        message: `Thank you for sharing all of that! Based on our conversation, I've classified your primary strategic need and generated your personalized engagement brief. Your main focus area is **${classificationResult.finalBucket}** — ${getBucketTagline(classificationResult.finalBucket)}`,
        finalBucket: classificationResult.finalBucket,
        confidence: classificationResult.confidence,
        allScores: classificationResult.allScores,
        reasoning: classificationResult.reasoning,
        briefAvailable: true,
        status: 'classified',
        bucketScores: updatedScores
      });
    }

    // Select next question — always routes from the leading bucket's SPIN pool
    // (after Q2 universal, Q3+ come from whichever bucket has highest score)
    const { question: nextQ, bucket: nextBucket } = selectNextQuestion(session);

    
    if (!nextQ) {
      return res.status(500).json({ error: 'No more questions available' });
    }

    // Optionally personalize with AI
    let questionText = nextQ.text;
    try {
      questionText = await generateAIQuestion(session, nextQ);
    } catch (e) {
      // Use template
    }

    // Add assistant message
    session.messages.push({
      role: 'assistant',
      content: questionText,
      questionType: nextQ.type,
      bucketFocus: nextBucket,
      questionIndex: session.currentQuestionIndex
    });

    session.currentQuestionIndex += 1;
    session.askedQuestionIds.push(nextQ.id);

    await session.save();

    const questionNumber = session.messages.filter(m => m.role === 'assistant').length;

    res.json({
      success: true,
      sessionId,
      message: questionText,
      questionNumber,
      totalQuestions: TOTAL_QUESTIONS,
      questionType: nextQ.type,
      bucketFocus: nextBucket,
      bucketScores: updatedScores,
      leadingBucket,
      completed: false,
      status: 'active',
      progress: Math.round((userMessageCount / TOTAL_QUESTIONS) * 100)
    });

  } catch (err) {
    console.error('Message error:', err);
    res.status(500).json({ error: 'Failed to process message', details: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/chat/:sessionId
// Resume a conversation
// ──────────────────────────────────────────────
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const userMessageCount = session.messages.filter(m => m.role === 'user').length;

    res.json({
      success: true,
      sessionId: session.sessionId,
      founderName: session.founderName,
      companyName: session.companyName,
      messages: session.messages,
      currentQuestionIndex: session.currentQuestionIndex,
      bucketScores: session.bucketScores,
      finalBucket: session.finalBucket,
      finalConfidence: session.finalConfidence,
      status: session.status,
      briefAvailable: !!session.brief,
      progress: Math.round((userMessageCount / TOTAL_QUESTIONS) * 100),
      branchingHistory: session.branchingHistory,
      questionsAnswered: userMessageCount,
      totalQuestions: TOTAL_QUESTIONS,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Failed to retrieve session', details: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/chat/:sessionId/brief
// Get the generated Markdown brief
// ──────────────────────────────────────────────
router.get('/:sessionId/brief', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'classified' || !session.brief) {
      // Generate brief if classification is done but brief is missing
      if (session.finalBucket) {
        const classificationResult = await classifyFounder(session);
        const brief = generateBrief(session, classificationResult);
        session.brief = brief;
        await session.save();
        
        if (req.query.download === 'true') {
          res.setHeader('Content-Type', 'text/markdown');
          res.setHeader('Content-Disposition', `attachment; filename="brief-${session.sessionId.substring(0, 8)}.md"`);
          return res.send(brief);
        }
        
        return res.json({ success: true, brief, finalBucket: session.finalBucket });
      }
      return res.status(400).json({ error: 'Conversation not yet completed. Please complete all 8 questions first.' });
    }

    if (req.query.download === 'true') {
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="strategy-brief-${session.sessionId.substring(0, 8)}.md"`);
      return res.send(session.brief);
    }

    res.json({
      success: true,
      brief: session.brief,
      finalBucket: session.finalBucket,
      confidence: session.finalConfidence,
      sessionId: session.sessionId
    });
  } catch (err) {
    console.error('Brief error:', err);
    res.status(500).json({ error: 'Failed to retrieve brief', details: err.message });
  }
});

// Helper: short taglines per bucket
function getBucketTagline(bucket) {
  const taglines = {
    GTM: "your go-to-market strategy needs sharpening to build scalable demand.",
    Sales: "improving your sales conversion and closing process will unlock your next revenue tier.",
    Pricing: "refining your pricing strategy will help you capture more value from every deal.",
    Brand: "building stronger brand authority will differentiate you and attract inbound demand.",
    Operations: "systematizing your operations will remove bottlenecks and free you to scale."
  };
  return taglines[bucket] || '';
}

module.exports = router;
