const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Session = require('../models/Session');

const REPORT_PATH = path.join(__dirname, '../../../eval/evaluation-report.json');

// ──────────────────────────────────────────────
// POST /api/evaluate
// Trigger evaluation run (used by evaluator.js)
// ──────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { results } = req.body;
    if (!results) {
      return res.status(400).json({ error: 'results required' });
    }

    const correct = results.filter(r => r.correct).length;
    const total = results.length;
    const accuracy = `${((correct / total) * 100).toFixed(1)}%`;
    const passed = correct >= Math.ceil(total * 0.833); // ≥83.3% = 10/12

    const report = {
      accuracy,
      passed,
      correct,
      total,
      results,
      timestamp: new Date().toISOString()
    };

    // Write report to file
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/evaluate/report
// Get the latest evaluation report
// ──────────────────────────────────────────────
router.get('/report', (req, res) => {
  try {
    if (!fs.existsSync(REPORT_PATH)) {
      return res.status(404).json({ 
        error: 'No evaluation report found. Run npm run evaluate first.',
        hint: 'cd server && npm run evaluate'
      });
    }

    const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
