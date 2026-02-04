/**
 * Authentication Controller
 * Handles signup, login, and Google OAuth
 */

const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { validateCategoryBudgets } = require('../utils/budgetValidator');
const { validationResult } = require('express-validator');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user with email/password
 */
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, location } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      location: location || '',
    });

    const token = generateToken(user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      monthlyIncome: user.monthlyIncome,
      plannedSpending: user.plannedSpending,
      categoryBudgets: user.categoryBudgets,
      monthlySavingsGoal: user.monthlySavingsGoal,
      setupCompleted: user.setupCompleted,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login with email/password
 */
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Google users may not have password
    if (!user.password) {
      return res.status(401).json({ message: 'Please use Google to sign in' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    const userResponse = await User.findById(user._id).select('-password');
    res.json({
      ...userResponse.toObject(),
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/**
 * @route   POST /api/auth/setup
 * @desc    Complete initial setup: income, planned spending, category budgets
 * CRITICAL: Validates sum(categoryBudgets) <= plannedSpending
 */
const completeSetup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { monthlyIncome, plannedSpending, categoryBudgets, monthlySavingsGoal } = req.body;

    // CRITICAL VALIDATION: sum(categoryBudgets) <= plannedSpending
    const validation = validateCategoryBudgets(plannedSpending, categoryBudgets);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    if (plannedSpending > monthlyIncome) {
      return res.status(400).json({
        message: 'Planned spending cannot exceed monthly income',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        monthlyIncome,
        plannedSpending,
        categoryBudgets: categoryBudgets || [],
        monthlySavingsGoal: monthlySavingsGoal || 0,
        setupCompleted: true,
      },
      { new: true }
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user (protected)
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth (handled by Passport)
 */

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback - generates JWT and redirects to frontend
 */
const googleCallback = (req, res) => {
  const token = generateToken(req.user._id);
  const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?token=${token}`;
  res.redirect(redirectUrl);
};

module.exports = {
  register,
  login,
  completeSetup,
  getMe,
  googleCallback,
};
