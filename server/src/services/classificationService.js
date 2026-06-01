const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const { scoreAnswer, KEYWORD_MAP } = require('./questionEngine');

// ──────────────────────────────────────────────
// AI PROVIDER SETUP
// ──────────────────────────────────────────────

let genAI = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Call Gemini API for classification assistance
 */
async function callGemini(prompt) {
  if (!genAI) throw new Error('Gemini not configured');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Call Groq API as fallback
 */
async function callGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') throw new Error('Groq not configured');
  
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );
  return response.data.choices[0].message.content;
}

/**
 * Call AI with fallback chain: Gemini → Groq → Rule-based
 */
async function callAI(prompt) {
  // Try Gemini first
  if (process.env.AI_PROVIDER !== 'groq') {
    try {
      return await callGemini(prompt);
    } catch (e) {
      console.warn('Gemini failed, trying Groq:', e.message);
    }
  }
  
  // Try Groq
  try {
    return await callGroq(prompt);
  } catch (e) {
    console.warn('Groq failed, using rule-based:', e.message);
    return null;
  }
}

// ──────────────────────────────────────────────
// HYBRID CLASSIFIER
// ──────────────────────────────────────────────

/**
 * Rule-based classifier using keyword scoring
 * Returns normalized bucket scores (0-100)
 */
function ruleBasedClassify(messages, currentScores) {
  const allAnswers = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ');

  const { scores, foundKeywords } = scoreAnswer(allAnswers);

  // Merge with cumulative session scores (session scores are already accumulated)
  const merged = {
    GTM: (currentScores.GTM || 0) + scores.GTM * 2,
    Sales: (currentScores.Sales || 0) + scores.Sales * 2,
    Pricing: (currentScores.Pricing || 0) + scores.Pricing * 2,
    Brand: (currentScores.Brand || 0) + scores.Brand * 2,
    Operations: (currentScores.Operations || 0) + scores.Operations * 2
  };

  // Normalize to 0-100
  const total = Object.values(merged).reduce((a, b) => a + b, 0) || 1;
  const normalized = {};
  for (const [k, v] of Object.entries(merged)) {
    normalized[k] = Math.round((v / total) * 100);
  }

  const finalBucket = Object.entries(normalized).sort((a, b) => b[1] - a[1])[0][0];
  const confidence = Math.round((normalized[finalBucket] / 100) * 100);

  return { scores: normalized, finalBucket, confidence, foundKeywords };
}

/**
 * LLM-assisted classification
 * Returns { finalBucket, confidence, reasoning }
 */
async function llmClassify(messages, ruleResult) {
  const conversationSummary = messages
    .filter(m => m.role !== 'system')
    .slice(-10) // Last 10 messages for context
    .map(m => `${m.role === 'assistant' ? 'Assistant' : 'Founder'}: ${m.content}`)
    .join('\n');

  const prompt = `You are a B2B strategy consultant analyzing a founder's conversation to classify them into the most appropriate engagement bucket.

CONVERSATION:
${conversationSummary}

RULE-BASED SCORES (keyword analysis):
${JSON.stringify(ruleResult.scores, null, 2)}
Current leading bucket: ${ruleResult.finalBucket}

ENGAGEMENT BUCKETS:
- GTM: Founder needs help with go-to-market strategy, lead generation, customer acquisition, market entry, demand generation
- Sales: Founder needs help with sales process, conversion rates, closing deals, pipeline management, sales team
- Pricing: Founder needs help with pricing strategy, packaging, monetization, revenue model, price objections
- Brand: Founder needs help with branding, positioning, thought leadership, market awareness, differentiation
- Operations: Founder needs help with workflows, processes, automation, team systems, operational efficiency

Based on the conversation, classify this founder into EXACTLY ONE bucket.

Respond ONLY with valid JSON in this exact format:
{
  "finalBucket": "GTM|Sales|Pricing|Brand|Operations",
  "confidence": 85,
  "reasoning": "One sentence explaining why"
}`;

  try {
    const response = await callAI(prompt);
    if (!response) return null;

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    const validBuckets = ['GTM', 'Sales', 'Pricing', 'Brand', 'Operations'];
    
    if (!validBuckets.includes(parsed.finalBucket)) return null;
    
    return {
      finalBucket: parsed.finalBucket,
      confidence: Math.min(100, Math.max(0, parsed.confidence || 75)),
      reasoning: parsed.reasoning || ''
    };
  } catch (e) {
    console.warn('LLM classification parse error:', e.message);
    return null;
  }
}

/**
 * Main hybrid classifier — combines rule-based + LLM
 */
async function classifyFounder(session) {
  const { messages, bucketScores } = session;

  // Step 1: Rule-based classification
  const ruleResult = ruleBasedClassify(messages, bucketScores);

  // Step 2: Try LLM validation
  const llmResult = await llmClassify(messages, ruleResult);

  let finalBucket, confidence, method, reasoning;

  if (llmResult) {
    // Weighted blend: LLM gets 60% weight if available
    const ruleScore = ruleResult.scores[ruleResult.finalBucket];
    const llmScore = llmResult.confidence;
    
    if (llmResult.finalBucket === ruleResult.finalBucket) {
      // Both agree — high confidence
      finalBucket = llmResult.finalBucket;
      confidence = Math.round((ruleScore + llmScore) / 2);
      method = 'hybrid-consensus';
    } else {
      // Disagree — use LLM if confidence > 70, else trust rule-based
      if (llmResult.confidence >= 70) {
        finalBucket = llmResult.finalBucket;
        confidence = llmResult.confidence;
        method = 'llm-override';
      } else {
        finalBucket = ruleResult.finalBucket;
        confidence = ruleResult.confidence;
        method = 'rule-based-fallback';
      }
    }
    reasoning = llmResult.reasoning;
  } else {
    // Rule-based only
    finalBucket = ruleResult.finalBucket;
    confidence = ruleResult.confidence;
    method = 'rule-based';
    reasoning = `Rule-based classification identified strong ${finalBucket} signals in the conversation.`;
  }

  return {
    finalBucket,
    confidence,
    method,
    reasoning,
    allScores: ruleResult.scores,
    foundKeywords: ruleResult.foundKeywords
  };
}

/**
 * Update bucket scores incrementally after each answer
 */
function updateBucketScores(currentScores, answerText) {
  const { scores } = scoreAnswer(answerText);
  return {
    GTM: (currentScores.GTM || 0) + scores.GTM,
    Sales: (currentScores.Sales || 0) + scores.Sales,
    Pricing: (currentScores.Pricing || 0) + scores.Pricing,
    Brand: (currentScores.Brand || 0) + scores.Brand,
    Operations: (currentScores.Operations || 0) + scores.Operations
  };
}

/**
 * Generate next question using AI with context awareness
 */
async function generateAIQuestion(session, candidateQuestion) {
  // If no AI available, use the template question directly
  const messages = session.messages || [];
  const previousAnswers = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n');

  if (!previousAnswers) return candidateQuestion.text;

  const prompt = `You are a B2B strategy consultant conducting a discovery conversation with a founder.

PREVIOUS ANSWERS FROM FOUNDER:
${previousAnswers}

CURRENT BUCKET SCORES:
${JSON.stringify(session.bucketScores, null, 2)}

CANDIDATE QUESTION (SPIN type: ${candidateQuestion.type}):
"${candidateQuestion.text}"

Your task: Slightly personalize this question based on what the founder said previously, but KEEP the same intent and SPIN type. Make it feel natural and conversational. Maximum 2 sentences. Do NOT change the core question dramatically.

Return ONLY the personalized question text, no quotes, no explanation.`;

  try {
    const response = await callAI(prompt);
    if (response && response.trim().length > 10) {
      return response.trim().replace(/^["']|["']$/g, '');
    }
  } catch (e) {
    // Use template question as fallback
  }
  
  return candidateQuestion.text;
}

module.exports = {
  classifyFounder,
  updateBucketScores,
  ruleBasedClassify,
  generateAIQuestion,
  callAI
};
