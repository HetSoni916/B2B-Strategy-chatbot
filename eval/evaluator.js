#!/usr/bin/env node
/**
 * B2B Chatbot Evaluation Runner
 * Simulates conversations for all 12 personas and generates evaluation report
 * Run: node eval/evaluator.js (from project root)
 * Or:  npm run evaluate (from server/ directory)
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────
const BASE_URL = process.env.EVAL_BASE_URL || 'http://localhost:5000';
const PERSONAS_PATH = path.join(__dirname, 'personas.json');
const REPORT_PATH = path.join(__dirname, 'evaluation-report.json');
const DELAY_MS = 300; // Delay between API calls to avoid rate limiting

// ──────────────────────────────────────────────
// STANDALONE CLASSIFIER (no server required)
// Mirrors the server's classification logic exactly
// ──────────────────────────────────────────────
const KEYWORD_MAP = {
  GTM: [
    'lead generation', 'leads', 'acquisition', 'market entry', 'demand generation',
    'pipeline generation', 'outbound', 'inbound', 'icp', 'ideal customer',
    'customer acquisition', 'top of funnel', 'awareness', 'reach',
    'new market', 'expansion', 'international', 'channel', 'distribution',
    'marketing strategy', 'go to market', 'gtm', 'traction', 'growth hacking',
    'product market fit', 'launch', 'entering', 'target market', 'prospecting',
    'cold outreach', 'seo', 'content marketing', 'paid ads', 'partnerships'
  ],
  Sales: [
    'conversion', 'close rate', 'closing', 'pipeline', 'sales team', 'quota',
    'deal', 'proposal', 'negotiation', 'objection', 'demo', 'discovery call',
    'sales cycle', 'follow up', 'crm', 'sales process', 'win rate',
    'lost deals', 'stalled', 'forecast', 'salespeople', 'account executive',
    'commission', 'sales rep', 'buyer', 'b2b sales', 'enterprise',
    'low close', 'not closing', 'poor conversion', 'sales enablement', 'convert'
  ],
  Pricing: [
    'pricing', 'price', 'package', 'packages', 'tier', 'tiered', 'revenue model',
    'monetization', 'subscription', 'saas pricing', 'value pricing', 'cost',
    'margin', 'markup', 'discount', 'too expensive', 'price sensitive',
    'willingness to pay', 'price objection', 'undercharging', 'overcharging',
    'pricing strategy', 'pricing model', 'freemium', 'enterprise pricing',
    'unit economics', 'ltv', 'cac', 'arpu', 'mrr', 'arr', 'profitability'
  ],
  Brand: [
    'brand', 'branding', 'positioning', 'awareness', 'trust', 'authority',
    'thought leadership', 'reputation', 'identity', 'messaging', 'story',
    'narrative', 'content', 'social media', 'differentiation', 'perception',
    'recognition', 'visibility', 'credibility', 'audience', 'community',
    'influencer', 'pr', 'press', 'media', 'website', 'copywriting',
    'value proposition', 'usp', 'marketing message', 'brand voice', 'niche'
  ],
  Operations: [
    'operations', 'workflow', 'process', 'automation', 'systems', 'bottleneck',
    'efficiency', 'capacity', 'team', 'hiring', 'delegation', 'sops',
    'standard operating', 'project management', 'delivery', 'fulfillment',
    'scaling team', 'overwhelmed', 'manual', 'repetitive', 'tools',
    'integration', 'backend', 'infrastructure', 'resource management',
    'operational overhead', 'fire fighting', 'chaos', 'disorganized', 'onboarding'
  ]
};

function scoreText(text) {
  const lower = text.toLowerCase();
  const scores = { GTM: 0, Sales: 0, Pricing: 0, Brand: 0, Operations: 0 };
  for (const [bucket, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        scores[bucket] += 1;
      }
    }
  }
  return scores;
}

function classifyLocally(answers) {
  const totalScores = { GTM: 0, Sales: 0, Pricing: 0, Brand: 0, Operations: 0 };
  
  for (const answer of answers) {
    const scores = scoreText(answer);
    for (const [bucket, score] of Object.entries(scores)) {
      totalScores[bucket] += score;
    }
  }
  
  const finalBucket = Object.entries(totalScores).sort((a, b) => b[1] - a[1])[0][0];
  const total = Object.values(totalScores).reduce((a, b) => a + b, 0) || 1;
  const confidence = Math.round((totalScores[finalBucket] / total) * 100);
  
  return { finalBucket, confidence, scores: totalScores };
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(msg, level = 'info') {
  const icons = { info: 'ℹ', success: '✅', error: '❌', warn: '⚠' };
  console.log(`${icons[level] || 'ℹ'} ${msg}`);
}

function printDivider(char = '─', width = 60) {
  console.log(char.repeat(width));
}

// ──────────────────────────────────────────────
// API SIMULATION (with local fallback)
// ──────────────────────────────────────────────

async function simulateViaAPI(persona) {
  // Start session
  const startRes = await axios.post(`${BASE_URL}/api/chat/start`, {
    founderName: persona.name,
    companyName: 'EvalCo',
    personaId: persona.id
  }, { timeout: 10000 });

  const { sessionId } = startRes.data;
  
  // Send all simulated answers
  let finalBucket = null;
  let confidence = 0;
  let allScores = null;

  for (let i = 0; i < persona.simulatedAnswers.length; i++) {
    await sleep(DELAY_MS);
    
    const msgRes = await axios.post(`${BASE_URL}/api/chat/message`, {
      sessionId,
      message: persona.simulatedAnswers[i]
    }, { timeout: 15000 });

    if (msgRes.data.completed) {
      finalBucket = msgRes.data.finalBucket;
      confidence = msgRes.data.confidence;
      allScores = msgRes.data.allScores;
      break;
    }

    // If we've sent all answers but haven't completed, check again
    if (i === persona.simulatedAnswers.length - 1 && !msgRes.data.completed) {
      finalBucket = msgRes.data.leadingBucket || msgRes.data.finalBucket;
      confidence = 60;
      allScores = msgRes.data.bucketScores;
    }
  }

  return { finalBucket, confidence, allScores, sessionId, method: 'api' };
}

async function simulateLocally(persona) {
  const result = classifyLocally(persona.simulatedAnswers);
  return { ...result, sessionId: `local-${persona.id}`, method: 'local' };
}

// ──────────────────────────────────────────────
// MAIN EVALUATOR
// ──────────────────────────────────────────────

async function runEvaluation() {
  console.log('\n');
  printDivider('═');
  console.log('   B2B Strategy-Intake Chatbot — Evaluation Runner');
  console.log(`   ${new Date().toLocaleString()}`);
  printDivider('═');

  // Load personas
  if (!fs.existsSync(PERSONAS_PATH)) {
    log(`Personas file not found: ${PERSONAS_PATH}`, 'error');
    process.exit(1);
  }

  const personas = JSON.parse(fs.readFileSync(PERSONAS_PATH, 'utf-8'));
  log(`Loaded ${personas.length} personas for evaluation\n`, 'info');

  // Check if API server is available
  let useAPI = false;
  try {
    const health = await axios.get(`${BASE_URL}/api/health`, { timeout: 3000 });
    if (health.data.status === 'ok') {
      useAPI = true;
      log(`Server detected at ${BASE_URL} — using API simulation`, 'success');
    }
  } catch (e) {
    log(`Server not available at ${BASE_URL} — using local classification`, 'warn');
    log('(Start the server with: cd server && npm run dev)\n', 'warn');
  }

  const results = [];
  let correct = 0;

  for (let i = 0; i < personas.length; i++) {
    const persona = personas[i];
    printDivider();
    log(`[${i + 1}/${personas.length}] Evaluating: ${persona.name} (${persona.id})`);
    log(`Expected Bucket: ${persona.expectedBucket}`);
    console.log(`Persona: ${persona.persona.substring(0, 100)}...`);

    try {
      let result;
      
      if (useAPI) {
        try {
          result = await simulateViaAPI(persona);
        } catch (apiErr) {
          log(`API call failed (${apiErr.message}), falling back to local`, 'warn');
          result = await simulateLocally(persona);
        }
      } else {
        result = await simulateLocally(persona);
      }

      const isCorrect = result.finalBucket === persona.expectedBucket;
      if (isCorrect) correct++;

      const status = isCorrect ? '✅ CORRECT' : `❌ WRONG (got ${result.finalBucket})`;
      log(`Classification: ${result.finalBucket} | Confidence: ${result.confidence}% | ${status}`);
      
      if (result.allScores || result.scores) {
        const scores = result.allScores || result.scores;
        const scoreStr = Object.entries(scores)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${k}:${v}`)
          .join(', ');
        console.log(`  Scores: ${scoreStr}`);
      }

      results.push({
        personaId: persona.id,
        personaName: persona.name,
        persona: persona.persona.substring(0, 100) + '...',
        expectedBucket: persona.expectedBucket,
        classifiedBucket: result.finalBucket,
        correct: isCorrect,
        confidence: result.confidence,
        scores: result.allScores || result.scores,
        sessionId: result.sessionId,
        method: result.method
      });

    } catch (err) {
      log(`Error evaluating ${persona.name}: ${err.message}`, 'error');
      results.push({
        personaId: persona.id,
        personaName: persona.name,
        persona: persona.persona.substring(0, 100) + '...',
        expectedBucket: persona.expectedBucket,
        classifiedBucket: 'ERROR',
        correct: false,
        confidence: 0,
        error: err.message,
        method: 'error'
      });
    }

    await sleep(200);
  }

  // ──────────────────────────────────────────────
  // GENERATE REPORT
  // ──────────────────────────────────────────────
  const total = personas.length;
  const accuracyNum = ((correct / total) * 100);
  const accuracy = `${accuracyNum.toFixed(1)}%`;
  const passed = correct >= Math.ceil(total * 0.833); // ≥10/12

  const report = {
    accuracy,
    passed,
    correct,
    total,
    threshold: `${Math.ceil(total * 0.833)}/${total} (83.3%)`,
    timestamp: new Date().toISOString(),
    simulationMethod: useAPI ? 'api' : 'local-rule-based',
    results,
    bucketBreakdown: generateBucketBreakdown(results),
    incorrectClassifications: results.filter(r => !r.correct).map(r => ({
      name: r.personaName,
      expected: r.expectedBucket,
      got: r.classifiedBucket
    }))
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  // ──────────────────────────────────────────────
  // PRINT SUMMARY
  // ──────────────────────────────────────────────
  printDivider('═');
  console.log('\n📊 EVALUATION RESULTS\n');
  console.log(`  Total Personas:     ${total}`);
  console.log(`  Correct:            ${correct}/${total}`);
  console.log(`  Accuracy:           ${accuracy}`);
  console.log(`  Pass Threshold:     ${Math.ceil(total * 0.833)}/${total} (≥83.3%)`);
  console.log(`  Status:             ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('');

  // Per-bucket accuracy
  console.log('  Per-Bucket Results:');
  const buckets = ['GTM', 'Sales', 'Pricing', 'Brand', 'Operations'];
  for (const bucket of buckets) {
    const bucketPersonas = results.filter(r => r.expectedBucket === bucket);
    const bucketCorrect = bucketPersonas.filter(r => r.correct).length;
    const bar = '█'.repeat(bucketCorrect * 3).padEnd(9, '░');
    console.log(`    ${bucket.padEnd(12)} ${bar} ${bucketCorrect}/${bucketPersonas.length}`);
  }

  if (results.some(r => !r.correct)) {
    console.log('\n  ❌ Incorrect Classifications:');
    results.filter(r => !r.correct).forEach(r => {
      console.log(`    • ${r.personaName}: expected ${r.expectedBucket}, got ${r.classifiedBucket}`);
    });
  }

  console.log(`\n  📄 Report saved to: ${REPORT_PATH}`);
  printDivider('═');
  console.log('');

  process.exit(passed ? 0 : 1);
}

function generateBucketBreakdown(results) {
  const buckets = ['GTM', 'Sales', 'Pricing', 'Brand', 'Operations'];
  const breakdown = {};
  for (const bucket of buckets) {
    const total = results.filter(r => r.expectedBucket === bucket).length;
    const correct = results.filter(r => r.expectedBucket === bucket && r.correct).length;
    breakdown[bucket] = { total, correct, accuracy: total > 0 ? `${((correct/total)*100).toFixed(0)}%` : 'N/A' };
  }
  return breakdown;
}

// Run
runEvaluation().catch(err => {
  console.error('Fatal evaluation error:', err);
  process.exit(1);
});
