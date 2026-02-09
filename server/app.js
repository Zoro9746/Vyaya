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
app.use(
  cors({
    // ✅ MUST be exact frontend origin (e.g. https://vyaya.vercel.app)
    origin: process.env.CLIENT_URL,
    // ✅ Allow browsers to send/receive cookies
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    // We do NOT rely on Authorization headers for auth,
    // but allow it in case future non-auth APIs need it.
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
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

// 🔍 Temporary debug route to inspect cookies from clients
// Useful for verifying SameSite=None; Secure behavior on mobile and cross-domain.
app.get('/api/debug-cookie', (req, res) => {
  res.json({
    cookies: req.cookies || {},
    signedCookies: req.signedCookies || {},
  });
});

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
