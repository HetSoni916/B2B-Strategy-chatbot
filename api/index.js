// Vercel serverless entry point — re-exports the Express app from server/
const app = require('../server/src/index');
module.exports = app;
