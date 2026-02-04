/**
 * Dashboard Controller
 * Aggregates data for user dashboard cards
 */

const Expense = require('../models/Expense');
const User = require('../models/User');

/**
 * Get start and end of current month (UTC)
 */
const getMonthBounds = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { start, end };
};

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard summary: income, planned spending, savings, expenses, remaining
 */
const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { start, end } = getMonthBounds();

    // Sum expenses for current month
    const expensesResult = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const expensesSoFar = expensesResult[0]?.total || 0;
    const monthlyIncome = user.monthlyIncome || 0;
    const plannedSpending = user.plannedSpending || 0;
    const savings = Math.max(0, monthlyIncome - plannedSpending);
    const remainingBalance = Math.max(0, plannedSpending - expensesSoFar);

    res.json({
      monthlyIncome,
      plannedSpending,
      savings,
      expensesSoFar,
      remainingBalance,
      categoryBudgets: user.categoryBudgets,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/**
 * @route   GET /api/dashboard/alerts
 * @desc    Get budget alerts (category exceeded, overall exceeded)
 */
const getAlerts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { start, end } = getMonthBounds();

    const alerts = [];

    // Get expenses by category for current month
    const categoryExpenses = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);

    const totalExpenses = categoryExpenses.reduce((sum, ce) => sum + ce.total, 0);
    const plannedSpending = user.plannedSpending || 0;

    // Check overall spending
    if (totalExpenses > plannedSpending && plannedSpending > 0) {
      alerts.push({
        type: 'overall',
        message: 'Overall spending exceeds your planned spending amount.',
        severity: 'danger',
      });
    }

    // Check category budgets
    const budgetMap = {};
    (user.categoryBudgets || []).forEach((cb) => {
      budgetMap[cb.category] = cb.amount;
    });

    categoryExpenses.forEach((ce) => {
      const budget = budgetMap[ce._id];
      if (budget && ce.total > budget) {
        alerts.push({
          type: 'category',
          category: ce._id,
          message: `${ce._id} budget exceeded (${ce.total} / ${budget})`,
          severity: 'warning',
        });
      }
    });

    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  getDashboard,
  getAlerts,
};
