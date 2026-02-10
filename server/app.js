/**
 * Express Application Setup
 * Middleware, routes, error handling
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportsRoutes = require('./routes/reportsRoutes');

require('./config/passport')(passport);

const app = express();

app.use(cookieParser());

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: false,
  }));
// STEP 5 — CORS: exact frontend origin only, no wildcard; credentials for cookies
app.use(
  cors({
    origin: process.env.CLIENT_URL || false, // false = no CORS when CLIENT_URL missing
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


// Rate limiting: stricter in production, lenient in development
// (Dev often hits /api/auth/me on every load + retries, so 100/15min can trigger 429)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 2000,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport
app.use(passport.initialize());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportsRoutes);

// Debug route: only in non-production (security)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug-cookie', (req, res) => {
    res.json({ cookies: req.cookies || {}, signedCookies: req.signedCookies || {} });
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
