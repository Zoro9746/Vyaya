/**
 * User/Profile Controller
 * Handles profile updates, income, budgets, and savings goals
 * CRITICAL: Validates sum(categoryBudgets) <= plannedSpending on updates
 */

const User = require('../models/User');
const { validateCategoryBudgets } = require('../utils/budgetValidator');
const { validationResult } = require('express-validator');

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile (name, phone, location)
 */
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, location } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (location !== undefined) updates.location = location;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/**
 * @route   PUT /api/users/financial
 * @desc    Update income, planned spending, category budgets, savings goal
 * CRITICAL: Validates sum(categoryBudgets) <= plannedSpending
 */
const updateFinancial = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { monthlyIncome, plannedSpending, categoryBudgets, monthlySavingsGoal } = req.body;

    // CRITICAL VALIDATION
    if (plannedSpending !== undefined && categoryBudgets !== undefined) {
      const validation = validateCategoryBudgets(plannedSpending, categoryBudgets);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }
    }

    // If only categoryBudgets provided, need user's plannedSpending
    if (categoryBudgets !== undefined) {
      const user = await User.findById(req.user._id);
      const planned = plannedSpending !== undefined ? plannedSpending : user.plannedSpending;
      const validation = validateCategoryBudgets(planned, categoryBudgets);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }
    }

    const updates = {};
    if (monthlyIncome !== undefined) updates.monthlyIncome = monthlyIncome;
    if (plannedSpending !== undefined) updates.plannedSpending = plannedSpending;
    if (categoryBudgets !== undefined) updates.categoryBudgets = categoryBudgets;
    if (monthlySavingsGoal !== undefined) updates.monthlySavingsGoal = monthlySavingsGoal;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateFinancial,
};
