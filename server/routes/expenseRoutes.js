/**
 * Expense Routes
 */

const express = require('express');
const { body } = require('express-validator');
const {
  addExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const expenseValidation = [
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('description').optional().trim(),
];

router.use(protect);
router.post('/', expenseValidation, addExpense);
router.get('/', getExpenses);
router.get('/:id', getExpense);
router.put('/:id', expenseValidation, updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
