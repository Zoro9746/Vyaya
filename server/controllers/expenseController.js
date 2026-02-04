/**
 * Expense Controller
 * CRUD operations for expenses with filtering
 */

const Expense = require('../models/Expense');
const { validationResult } = require('express-validator');

/**
 * @route   POST /api/expenses
 * @desc    Add new expense
 */
const addExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, category, description } = req.body;

    const expense = await Expense.create({
      user: req.user._id,
      amount,
      category,
      description: description || '',
    });

    const populated = await Expense.findById(expense._id).populate('user', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/**
 * @route   GET /api/expenses
 * @desc    Get expenses with optional filters: date, category, month
 * Query params: category, startDate, endDate, month, year
 */
const getExpenses = async (req, res) => {
  try {
    const { category, startDate, endDate, month, year } = req.query;
    const match = { user: req.user._id };

    if (category) {
      match.category = new RegExp(category, 'i');
    }

    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      match.date = {
        $gte: new Date(y, m - 1, 1),
        $lte: new Date(y, m, 0, 23, 59, 59, 999),
      };
    } else if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(match).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/**
 * @route   GET /api/expenses/:id
 * @desc    Get single expense
 */
const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/**
 * @route   PUT /api/expenses/:id
 * @desc    Update expense
 */
const updateExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete expense
 */
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  addExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
};
