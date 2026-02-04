/**
 * Analytics Routes
 */

const express = require('express');
const {
  getCategoryDistribution,
  getMonthlyComparison,
  getBudgetUsage,
  getSavingsGoal,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/category-distribution', getCategoryDistribution);
router.get('/monthly-comparison', getMonthlyComparison);
router.get('/budget-usage', getBudgetUsage);
router.get('/savings-goal', getSavingsGoal);

module.exports = router;
