/**
 * Vyaya Server Entry Point
 * Boot order: 1. dotenv  2. env validation (fail-fast)  3. DB connect  4. app + listen
 */

const path = require('path');

// STEP 1 — Load .env FIRST from server directory (works regardless of cwd)
require('dotenv').config({ path: path.join(__dirname, '.env') });

// STEP 2 — Fail-fast: refuse to start without required env (no mysterious crashes)
function validateEnv() {
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.MONGODB_URI) missing.push('MONGODB_URI');
  if (missing.length) {
    console.error('Missing required environment variables:', missing.join(', '));
    throw new Error(`Missing ${missing.join(', ')} — server cannot start.`);
  }
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.CLIENT_URL) {
      throw new Error('CLIENT_URL is required in production (frontend origin for CORS and redirects).');
    }
    const url = process.env.CLIENT_URL.trim();
    if (url.endsWith('/')) {
      throw new Error('CLIENT_URL must not have a trailing slash.');
    }
  }
}

validateEnv();

// Trust proxy BEFORE any routes (required for secure cookies behind Render)
const app = require('./app');
app.set('trust proxy', 1);

const connectDB = require('./config/db');
const PORT = process.env.PORT || 5000;

// Boot: connect DB then listen (no listen before DB is ready)
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Vyaya server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Server failed to start:', err.message);
  process.exit(1);
});
