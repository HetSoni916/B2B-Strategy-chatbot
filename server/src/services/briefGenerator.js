/**
 * Markdown Brief Generator
 * Generates a structured engagement brief from session data
 */

const BUCKET_DESCRIPTIONS = {
  GTM: {
    full: 'Go-to-Market Strategy',
    description: 'Your primary challenge centers around getting your product or service in front of the right buyers and building a scalable demand engine.',
    engagement: 'GTM Strategy Sprint — We will work together to define your ICP, identify your highest-leverage acquisition channels, and build a repeatable pipeline generation system.',
    nextSteps: [
      'Conduct a full ICP (Ideal Customer Profile) deep-dive and refine your target segments',
      'Audit your existing acquisition channels and identify the top 2–3 to double down on',
      'Design a 90-day demand generation playbook with measurable pipeline targets'
    ]
  },
  Sales: {
    full: 'Sales Process & Conversion',
    description: 'Your primary challenge is converting qualified prospects into paying customers — improving close rates, shortening the sales cycle, and building a predictable revenue engine.',
    engagement: 'Sales Acceleration Program — We will diagnose your sales funnel, identify drop-off points, and build a playbook to improve your close rate by 20–30%.',
    nextSteps: [
      'Map your current sales process and identify the top 3 stages where deals stall or die',
      'Develop and test a stronger discovery framework and objection-handling scripts',
      'Implement pipeline hygiene practices and a CRM workflow to improve forecast accuracy'
    ]
  },
  Pricing: {
    full: 'Pricing Strategy & Monetization',
    description: 'Your primary challenge is building a pricing model that captures the full value you deliver, reduces price objections, and supports your revenue growth targets.',
    engagement: 'Pricing Strategy Workshop — We will run value-based pricing analysis, restructure your packages, and develop positioning that justifies your price point.',
    nextSteps: [
      'Conduct a value-based pricing audit: map features to customer outcomes and willingness to pay',
      'Redesign your pricing tiers to create a clear good/better/best structure',
      'Develop a pricing conversation guide that reframes cost as ROI for your sales team'
    ]
  },
  Brand: {
    full: 'Brand Positioning & Authority',
    description: 'Your primary challenge is building a strong, distinct brand identity that creates trust, differentiates you from competitors, and generates inbound demand.',
    engagement: 'Brand Authority Build — We will sharpen your positioning, develop a compelling brand narrative, and create a content strategy that builds market authority.',
    nextSteps: [
      'Develop a clear brand positioning statement and unique value proposition',
      'Create a 90-day thought leadership content plan aligned to your target audience\'s pain points',
      'Audit and refresh key brand touchpoints: website, LinkedIn, and core sales materials'
    ]
  },
  Operations: {
    full: 'Operations & Systems Design',
    description: 'Your primary challenge is building scalable systems and workflows that remove bottlenecks, reduce founder dependency, and support sustainable team growth.',
    engagement: 'Operations Systems Sprint — We will map your core processes, identify automation opportunities, and build SOPs that allow you to scale without chaos.',
    nextSteps: [
      'Conduct a process audit to identify the top 5 workflows that need documentation or automation',
      'Design and implement SOPs for your highest-frequency, highest-stakes operations',
      'Select and integrate the right tools to eliminate manual handoffs and reduce operational drag'
    ]
  }
};

/**
 * Format bucket scores as a visual bar chart in Markdown
 */
function formatScoresChart(scores) {
  const maxScore = Math.max(...Object.values(scores)) || 1;
  let chart = '';
  for (const [bucket, score] of Object.entries(scores)) {
    const normalized = Math.round((score / maxScore) * 10);
    const bar = '█'.repeat(normalized) + '░'.repeat(10 - normalized);
    chart += `| ${bucket.padEnd(12)} | ${bar} | ${score}pts |\n`;
  }
  return chart;
}

/**
 * Extract key challenges from the conversation
 */
function extractChallenges(messages) {
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content);

  if (userMessages.length === 0) return ['No detailed responses captured.'];

  // Return first 3 user responses as key challenges (summarized)
  return userMessages.slice(0, 4).map((msg, i) => {
    const truncated = msg.length > 200 ? msg.substring(0, 200) + '...' : msg;
    return truncated;
  });
}

/**
 * Generate the complete Markdown brief
 */
function generateBrief(session, classificationResult) {
  const {
    sessionId,
    founderName,
    companyName,
    messages,
    bucketScores,
    branchingHistory,
    createdAt
  } = session;

  const {
    finalBucket,
    confidence,
    method,
    reasoning,
    allScores
  } = classificationResult;

  const bucketInfo = BUCKET_DESCRIPTIONS[finalBucket];
  const challenges = extractChallenges(messages);
  const date = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const questionsAnswered = messages.filter(m => m.role === 'user').length;

  const brief = `# Strategy Engagement Brief

**Session ID:** ${sessionId}  
**Date:** ${date}  
**Questions Answered:** ${questionsAnswered} of 8

---

## Founder Summary

**Name:** ${founderName || 'Not provided'}  
**Company:** ${companyName || 'Not provided'}

${founderName || 'The founder'} engaged in a discovery conversation covering their current business situation, key growth challenges, and strategic priorities. The conversation followed the SPIN framework — exploring Situation, Problem, Implication, and Need-Payoff to surface the most critical area requiring strategic support.

---

## Key Challenges Identified

During the conversation, the following challenges were surfaced:

${challenges.map((c, i) => `**${i + 1}.** "${c}"`).join('\n\n')}

---

## Bucket Classification

### 🎯 ${finalBucket} — ${bucketInfo.full}

${bucketInfo.description}

### Why This Bucket Was Chosen

${reasoning || `The conversation revealed consistent signals pointing to ${finalBucket} as the primary strategic need. ${bucketInfo.description}`}

**Classification Method:** ${method}

---

## Confidence Score Analysis

| Bucket       | Signal Strength |  Score |
|:-------------|:----------------|-------:|
${Object.entries(allScores || bucketScores)
  .sort((a, b) => b[1] - a[1])
  .map(([bucket, score]) => {
    const star = bucket === finalBucket ? '⭐ ' : '   ';
    const bar = '█'.repeat(Math.round(score / 10)).padEnd(10, '░');
    return `| ${star}${bucket.padEnd(10)} | ${bar} | ${score}% |`;
  }).join('\n')}

**Overall Classification Confidence:** ${confidence}%

---

## Recommended Engagement

**${bucketInfo.engagement}**

This engagement is designed specifically for founders in your situation — where ${finalBucket.toLowerCase()} challenges are the primary growth constraint.

---

## Top 3 Next Steps

${bucketInfo.nextSteps.map((step, i) => `${i + 1}. **${step}**`).join('\n\n')}

---

## Branching Path Summary

This conversation followed a **${finalBucket}-focused** discovery path after detecting relevant signals in your early responses.

${branchingHistory && branchingHistory.length > 0 ? 
  branchingHistory.slice(0, 3).map(event => 
    `- At Question ${event.questionIndex + 1}: Detected **${event.bucketSignal}** signals (keywords: ${event.detectedKeywords.slice(0, 3).join(', ')})`
  ).join('\n') : 
  '- Discovery path was dynamically adapted based on your responses throughout the conversation.'
}

---

## What This Engagement Delivers

Based on your profile, a focused engagement in the **${bucketInfo.full}** area would help you:

- Diagnose the root cause of your current constraint (not just the symptoms)
- Build a concrete 90-day action plan with measurable milestones
- Get access to frameworks and playbooks proven in similar businesses
- Establish accountability and momentum to execute

---

*This brief was auto-generated by the B2B Strategy-Intake System based on your discovery conversation. All insights are preliminary and will be refined in a full strategy session.*

*Generated on ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC*
`;

  return brief;
}

module.exports = { generateBrief, BUCKET_DESCRIPTIONS };
