/**
 * User/Profile Routes
 */

const express = require('express');
const { body } = require('express-validator');
const { getProfile, updateProfile, updateFinancial } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

const profileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim(),
  body('location').optional().trim(),
];

const financialValidation = [
  body('monthlyIncome').optional().isFloat({ min: 0 }).withMessage('Valid income required'),
  body('plannedSpending').optional().isFloat({ min: 0 }).withMessage('Valid amount required'),
  body('categoryBudgets').optional().isArray(),
  body('categoryBudgets.*.category').optional().trim(),
  body('categoryBudgets.*.amount').optional().isFloat({ min: 0 }),
  body('monthlySavingsGoal').optional().isFloat({ min: 0 }),
];

router.get('/profile', getProfile);
router.put('/profile', profileValidation, updateProfile);
router.put('/financial', financialValidation, updateFinancial);

module.exports = router;
