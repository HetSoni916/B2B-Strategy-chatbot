/**
 * Comprehensive SPIN Question Bank
 * 5 buckets × 4 SPIN types = 20 targeted questions
 * Plus 4 universal opening questions
 */

const QUESTION_BANK = {
  // ──────────────────────────────────────────────
  // UNIVERSAL — asked at start regardless of bucket
  // ──────────────────────────────────────────────
  universal: [
    {
      id: 'U1',
      type: 'Situation',
      text: "Welcome! To kick things off, could you tell me about your company, what you do, and where you are in your growth journey?",
      followUp: null,
      weight: {}
    },
    {
      id: 'U2',
      type: 'Problem',
      text: "What is the single biggest obstacle standing between you and your growth targets right now?",
      followUp: null,
      weight: {
        GTM: 0.1, Sales: 0.1, Pricing: 0.1, Brand: 0.1, Operations: 0.1
      }
    }
  ],

  // ──────────────────────────────────────────────
  // GTM — Go-to-Market
  // ──────────────────────────────────────────────
  GTM: [
    {
      id: 'GTM-S1',
      type: 'Situation',
      text: "Walk me through your current customer acquisition channels. Which ones are working, and which have you tried that fell flat?",
      weight: { GTM: 3 }
    },
    {
      id: 'GTM-S2',
      type: 'Situation',
      text: "How clearly defined is your Ideal Customer Profile (ICP), and how does that guide your outreach today?",
      weight: { GTM: 3 }
    },
    {
      id: 'GTM-P1',
      type: 'Problem',
      text: "Where exactly is your pipeline breaking down — awareness, lead generation, or moving prospects to a first conversation?",
      weight: { GTM: 4, Sales: 1 }
    },
    {
      id: 'GTM-P2',
      type: 'Problem',
      text: "When you enter a new market or launch a new product, what's the biggest barrier to generating early traction?",
      weight: { GTM: 4 }
    },
    {
      id: 'GTM-I1',
      type: 'Implication',
      text: "If your lead generation numbers stay flat for another 12 months, what does that mean for your runway or growth targets?",
      weight: { GTM: 5 }
    },
    {
      id: 'GTM-I2',
      type: 'Implication',
      text: "How are your competitors gaining market share while you're struggling to reach the right buyers?",
      weight: { GTM: 4 }
    },
    {
      id: 'GTM-N1',
      type: 'NeedPayoff',
      text: "If we helped you build a repeatable, scalable demand-generation engine, what would success look like in 90 days?",
      weight: { GTM: 5 }
    },
    {
      id: 'GTM-N2',
      type: 'NeedPayoff',
      text: "What does a winning GTM motion look like for your business — and what's one metric you'd use to know it's working?",
      weight: { GTM: 5 }
    }
  ],

  // ──────────────────────────────────────────────
  // Sales
  // ──────────────────────────────────────────────
  Sales: [
    {
      id: 'SALES-S1',
      type: 'Situation',
      text: "Describe your current sales process from first contact to closed deal. How long is your average cycle?",
      weight: { Sales: 3 }
    },
    {
      id: 'SALES-S2',
      type: 'Situation',
      text: "Do you have a dedicated sales team, or is it founder-led? How are quotas and targets structured?",
      weight: { Sales: 3 }
    },
    {
      id: 'SALES-P1',
      type: 'Problem',
      text: "Where do deals most commonly stall or die? Is it at qualification, proposal, or closing?",
      weight: { Sales: 4 }
    },
    {
      id: 'SALES-P2',
      type: 'Problem',
      text: "What is your current close rate, and how does that compare to where you need it to be?",
      weight: { Sales: 5 }
    },
    {
      id: 'SALES-I1',
      type: 'Implication',
      text: "If your conversion rate stays at its current level, what happens to your revenue targets and team morale over the next year?",
      weight: { Sales: 5 }
    },
    {
      id: 'SALES-I2',
      type: 'Implication',
      text: "How much revenue are you leaving on the table each month due to lost or stalled deals?",
      weight: { Sales: 4 }
    },
    {
      id: 'SALES-N1',
      type: 'NeedPayoff',
      text: "If we helped you improve your close rate by 20–30%, what would that mean for your ARR and team confidence?",
      weight: { Sales: 5 }
    },
    {
      id: 'SALES-N2',
      type: 'NeedPayoff',
      text: "What does a high-performing, predictable sales engine look like for your business in the next 6 months?",
      weight: { Sales: 5 }
    }
  ],

  // ──────────────────────────────────────────────
  // Pricing
  // ──────────────────────────────────────────────
  Pricing: [
    {
      id: 'PRICE-S1',
      type: 'Situation',
      text: "Walk me through your current pricing model. How did you arrive at your current price points?",
      weight: { Pricing: 3 }
    },
    {
      id: 'PRICE-S2',
      type: 'Situation',
      text: "How many pricing tiers or packages do you offer, and how do customers typically choose between them?",
      weight: { Pricing: 3 }
    },
    {
      id: 'PRICE-P1',
      type: 'Problem',
      text: "Are prospects frequently pushing back on price, or are you unsure if you're priced too low and leaving money on the table?",
      weight: { Pricing: 5 }
    },
    {
      id: 'PRICE-P2',
      type: 'Problem',
      text: "How confident are you that your pricing accurately reflects the value you deliver to customers?",
      weight: { Pricing: 4 }
    },
    {
      id: 'PRICE-I1',
      type: 'Implication',
      text: "If you continue with your current pricing strategy, how does that affect your unit economics and path to profitability?",
      weight: { Pricing: 5 }
    },
    {
      id: 'PRICE-I2',
      type: 'Implication',
      text: "When price objections kill deals, what's the compounding revenue impact over 12 months?",
      weight: { Pricing: 4 }
    },
    {
      id: 'PRICE-N1',
      type: 'NeedPayoff',
      text: "If we helped you build a value-aligned pricing strategy, what outcome would make this engagement a clear win?",
      weight: { Pricing: 5 }
    },
    {
      id: 'PRICE-N2',
      type: 'NeedPayoff',
      text: "What would a confident, competitive pricing framework mean for your sales conversations and revenue growth?",
      weight: { Pricing: 5 }
    }
  ],

  // ──────────────────────────────────────────────
  // Brand
  // ──────────────────────────────────────────────
  Brand: [
    {
      id: 'BRAND-S1',
      type: 'Situation',
      text: "How would your best customer describe your brand and what makes you different from alternatives?",
      weight: { Brand: 3 }
    },
    {
      id: 'BRAND-S2',
      type: 'Situation',
      text: "What content or thought-leadership do you currently produce, and how does it support your positioning?",
      weight: { Brand: 3 }
    },
    {
      id: 'BRAND-P1',
      type: 'Problem',
      text: "Do prospects understand your unique value proposition quickly, or do you find yourself over-explaining what you do?",
      weight: { Brand: 5 }
    },
    {
      id: 'BRAND-P2',
      type: 'Problem',
      text: "Where is your brand awareness weakest — in target markets, with decision-makers, or in online visibility?",
      weight: { Brand: 4 }
    },
    {
      id: 'BRAND-I1',
      type: 'Implication',
      text: "If your brand continues to feel indistinct in the market, how does that affect your ability to command premium pricing or attract top talent?",
      weight: { Brand: 5 }
    },
    {
      id: 'BRAND-I2',
      type: 'Implication',
      text: "How is weak positioning affecting inbound inquiries and word-of-mouth referrals?",
      weight: { Brand: 4 }
    },
    {
      id: 'BRAND-N1',
      type: 'NeedPayoff',
      text: "If we helped you develop a clear, compelling brand story and positioning, what doors would that open for you?",
      weight: { Brand: 5 }
    },
    {
      id: 'BRAND-N2',
      type: 'NeedPayoff',
      text: "What would it mean for your business if prospects immediately understood your value and trusted your authority in the market?",
      weight: { Brand: 5 }
    }
  ],

  // ──────────────────────────────────────────────
  // Operations
  // ──────────────────────────────────────────────
  Operations: [
    {
      id: 'OPS-S1',
      type: 'Situation',
      text: "How are your core business processes currently documented and managed — or are they mostly in people's heads?",
      weight: { Operations: 3 }
    },
    {
      id: 'OPS-S2',
      type: 'Situation',
      text: "What tools or systems does your team rely on daily, and are they integrated or siloed?",
      weight: { Operations: 3 }
    },
    {
      id: 'OPS-P1',
      type: 'Problem',
      text: "Where does work most frequently get dropped, delayed, or duplicated in your operations?",
      weight: { Operations: 5 }
    },
    {
      id: 'OPS-P2',
      type: 'Problem',
      text: "As you've grown, which manual processes are now taking up disproportionate time and creating bottlenecks?",
      weight: { Operations: 4 }
    },
    {
      id: 'OPS-I1',
      type: 'Implication',
      text: "If your operational bottlenecks remain unresolved, how does that limit your capacity to take on new clients or scale the team?",
      weight: { Operations: 5 }
    },
    {
      id: 'OPS-I2',
      type: 'Implication',
      text: "How much founder or leadership time is consumed by operational fire-fighting instead of strategic work?",
      weight: { Operations: 4 }
    },
    {
      id: 'OPS-N1',
      type: 'NeedPayoff',
      text: "If we helped you systematize and automate your key workflows, what would that free you up to focus on?",
      weight: { Operations: 5 }
    },
    {
      id: 'OPS-N2',
      type: 'NeedPayoff',
      text: "What does a smoothly operating, scalable business look like for you — and what's the first thing you'd fix?",
      weight: { Operations: 5 }
    }
  ]
};

// Keyword maps for rule-based scoring
const KEYWORD_MAP = {
  GTM: [
    'lead generation', 'leads', 'acquisition', 'market entry', 'demand generation',
    'pipeline generation', 'outbound', 'inbound', 'icp', 'ideal customer',
    'customer acquisition', 'top of funnel', 'tofus', 'awareness', 'reach',
    'new market', 'expansion', 'international', 'channel', 'distribution',
    'marketing strategy', 'go to market', 'gtm', 'traction', 'growth hacking',
    'product market fit', 'launch', 'entering', 'target market', 'prospecting',
    'cold outreach', 'seo', 'content marketing', 'paid ads', 'partnerships'
  ],
  Sales: [
    'conversion', 'close rate', 'closing', 'pipeline', 'sales team', 'quota',
    'deal', 'proposal', 'negotiation', 'objection', 'demo', 'discovery call',
    'sales cycle', 'follow up', 'crm', 'revenue', 'sales process', 'win rate',
    'lost deals', 'stalled', 'forecast', 'salespeople', 'account executive',
    'commission', 'sales rep', 'buyer', 'procurement', 'b2b sales', 'enterprise',
    'low close', 'not closing', 'poor conversion', 'sales enablement'
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
    'value proposition', 'usp', 'marketing message', 'brand voice'
  ],
  Operations: [
    'operations', 'workflow', 'process', 'automation', 'systems', 'bottleneck',
    'efficiency', 'capacity', 'team', 'hiring', 'delegation', 'sops',
    'standard operating', 'project management', 'delivery', 'fulfillment',
    'scaling team', 'overwhelmed', 'manual', 'repetitive', 'tools',
    'integration', 'backend', 'infrastructure', 'resource management',
    'operational overhead', 'fire fighting', 'chaos', 'disorganized'
  ]
};

/**
 * Score an answer against all bucket keywords
 * Returns { GTM: n, Sales: n, ... }
 */
function scoreAnswer(text) {
  const lower = text.toLowerCase();
  const scores = { GTM: 0, Sales: 0, Pricing: 0, Brand: 0, Operations: 0 };
  const foundKeywords = { GTM: [], Sales: [], Pricing: [], Brand: [], Operations: [] };

  for (const [bucket, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        scores[bucket] += 1;
        foundKeywords[bucket].push(kw);
      }
    }
  }

  return { scores, foundKeywords };
}

/**
 * Get the leading bucket from scores
 */
function getLeadingBucket(bucketScores) {
  // Stable sort: sort by score DESC, then alphabetically for consistent tie-breaking
  const sorted = Object.entries(bucketScores)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return sorted[0][0];
}

/**
 * Get the dominant bucket from branching history (most frequently signaled)
 */
function getDominantBucketFromHistory(branchingHistory) {
  if (!branchingHistory || branchingHistory.length === 0) return null;
  const counts = {};
  branchingHistory.forEach(ev => {
    const b = ev.bucketSignal;
    if (b) counts[b] = (counts[b] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

/**
 * Select the next question for a session
 * Never repeats, follows SPIN order per bucket
 */
function selectNextQuestion(session) {
  const { currentQuestionIndex, bucketScores } = session;

  // Convert Mongoose DocumentArray to plain JS array to ensure .includes() works
  const askedQuestionIds = Array.isArray(session.askedQuestionIds)
    ? session.askedQuestionIds.map(id => String(id))
    : [];

  // First 2 questions are always universal
  if (currentQuestionIndex === 0) {
    const q = QUESTION_BANK.universal[0];
    return { question: q, bucket: null };
  }
  if (currentQuestionIndex === 1) {
    const q = QUESTION_BANK.universal[1];
    return { question: q, bucket: null };
  }

  // After question 2, route by leading bucket
  // Use branching history for more reliable signal when scores are low or tied
  const totalScore = Object.values(bucketScores).reduce((a, b) => a + b, 0);
  const scores = bucketScores;
  const maxScore = Math.max(...Object.values(scores));
  const tiedBuckets = Object.entries(scores).filter(([, v]) => v === maxScore);

  let leadBucket;
  if (totalScore === 0) {
    // No signals at all yet — check branchingHistory for earliest keyword signals
    const historicalBucket = getDominantBucketFromHistory(session.branchingHistory || []);
    leadBucket = historicalBucket || 'GTM';
  } else if (tiedBuckets.length > 1) {
    // Tie — use branching history to break tie, otherwise pick highest scored from history
    const historicalBucket = getDominantBucketFromHistory(session.branchingHistory || []);
    const tiedNames = tiedBuckets.map(([k]) => k);
    leadBucket = (historicalBucket && tiedNames.includes(historicalBucket))
      ? historicalBucket
      : getLeadingBucket(bucketScores);
  } else {
    leadBucket = getLeadingBucket(bucketScores);
  }

  const bucketQuestions = QUESTION_BANK[leadBucket];

  if (!bucketQuestions) {
    // Safety fallback — should never happen
    const q = QUESTION_BANK.GTM.find(q => !askedQuestionIds.includes(q.id));
    return { question: q, bucket: 'GTM' };
  }

  // SPIN order: Situation → Problem → Implication → NeedPayoff
  const questionsAsked = currentQuestionIndex - 2; // questions from bucket pool

  // Pick the right SPIN type based on depth
  let targetType;
  if (questionsAsked < 2) targetType = 'Situation';
  else if (questionsAsked < 4) targetType = 'Problem';
  else if (questionsAsked < 6) targetType = 'Implication';
  else targetType = 'NeedPayoff';

  // Find first unasked question of target type in leading bucket
  let selected = bucketQuestions.find(
    q => q.type === targetType && !askedQuestionIds.includes(q.id)
  );

  // Fallback: any unasked question from leading bucket
  if (!selected) {
    selected = bucketQuestions.find(q => !askedQuestionIds.includes(q.id));
  }

  // Last resort: any unasked question from any bucket
  if (!selected) {
    for (const bucket of ['GTM', 'Sales', 'Pricing', 'Brand', 'Operations']) {
      selected = QUESTION_BANK[bucket].find(q => !askedQuestionIds.includes(q.id));
      if (selected) break;
    }
  }

  return { question: selected, bucket: leadBucket };
}

module.exports = {
  QUESTION_BANK,
  KEYWORD_MAP,
  scoreAnswer,
  getLeadingBucket,
  getDominantBucketFromHistory,
  selectNextQuestion
};
