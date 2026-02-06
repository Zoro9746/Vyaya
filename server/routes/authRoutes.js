/**
 * Authentication Routes
 */

const express = require('express');
const passport = require('passport');
const { body } = require('express-validator');
const {
  register,
  login,
  completeSetup,
  getMe,
  googleCallback,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');



const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
  body('location').optional().trim(),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const setupValidation = [
  body('monthlyIncome').isFloat({ min: 0 }).withMessage('Valid monthly income required'),
  body('plannedSpending')
    .isFloat({ min: 0 })
    .withMessage('Valid planned spending required'),
  body('categoryBudgets')
    .optional()
    .isArray()
    .withMessage('Category budgets must be an array'),
  body('categoryBudgets.*.category').optional().trim(),
  body('categoryBudgets.*.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Category amount must be positive'),
  body('monthlySavingsGoal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Savings goal must be positive'),
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login` }),
  googleCallback
);

// Logout route
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);
router.post('/setup', protect, setupValidation, completeSetup);

module.exports = router;
