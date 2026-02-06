/**
 * Authentication Controller
 * Handles signup, login, setup, and Google OAuth
 * Uses secure cookie-based JWT authentication
 */

const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { validateCategoryBudgets } = require('../utils/budgetValidator');
const { validationResult } = require('express-validator');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (Email + Password)
 */
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      location: location || '',
    });

    // Generate JWT and set cookie
    generateToken(res, user._id);

    // Return user data (NO token in response)
    res.status(201).json(user);
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
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Set auth cookie
    generateToken(res, user._id);

    // Send user data
    const safeUser = await User.findById(user._id).select('-password');
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/**
 * @route   POST /api/auth/setup
 * @desc    Complete initial setup (income & budgets)
 */
const completeSetup = async (req, res) => {
  try {
    const { monthlyIncome, plannedSpending, categoryBudgets, monthlySavingsGoal } = req.body;

    // Validate category budgets
    const validation = validateCategoryBudgets(plannedSpending, categoryBudgets);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    if (plannedSpending > monthlyIncome) {
      return res.status(400).json({ message: 'Planned spending cannot exceed income' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        monthlyIncome,
        plannedSpending,
        categoryBudgets,
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
 * @desc    Get current logged-in user
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
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 */
const googleCallback = (req, res) => {
  // Set auth cookie
  generateToken(res, req.user._id);

  // Redirect to frontend dashboard
  res.redirect(`${process.env.CLIENT_URL}/dashboard`);
};


/**
 * @route   POST /api/auth/logout
 * @desc    Logout user by clearing auth cookie
 */
const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: true,      // required on Render (HTTPS)
    sameSite: 'None',  // required for cross-site cookies
    expires: new Date(0),
  });

  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  register,
  login,
  completeSetup,
  getMe,
  googleCallback,
  logout, // 👈 add this
};