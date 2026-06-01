/**
 * Hybrid Session Store
 * - Uses MongoDB when MONGODB_URI is set (production with DB)
 * - Falls back to in-memory Map when MongoDB is unavailable (serverless demo mode)
 *
 * In-memory sessions persist for the lifetime of the serverless function
 * instance (~5-30 min). Good enough for a full 8-question conversation.
 */

const memoryStore = new Map();

// ── In-memory session model (mirrors Mongoose interface) ──────────────────────
class MemorySession {
  constructor(data) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    memoryStore.set(this.sessionId, JSON.parse(JSON.stringify(this)));
    return this;
  }

  static async findOne({ sessionId }) {
    const data = memoryStore.get(sessionId);
    if (!data) return null;
    const s = new MemorySession(data);
    s._isNew = false;
    return s;
  }
}

// ── Exported helpers ──────────────────────────────────────────────────────────
let useMemory = false;

function setMemoryMode(val) {
  useMemory = val;
  if (val) console.log('⚠️  No MONGODB_URI — using in-memory session store (demo mode)');
}

function isMemoryMode() {
  return useMemory;
}

/**
 * Create a session — works with either MongoDB Session model or MemorySession
 */
async function createSession(data, MongoSession) {
  if (useMemory) {
    const s = new MemorySession(data);
    await s.save();
    return s;
  }
  const s = new MongoSession(data);
  await s.save();
  return s;
}

/**
 * Find a session — works with either store
 */
async function findSession(sessionId, MongoSession) {
  if (useMemory) return MemorySession.findOne({ sessionId });
  return MongoSession.findOne({ sessionId });
}

module.exports = { setMemoryMode, isMemoryMode, createSession, findSession, MemorySession };
