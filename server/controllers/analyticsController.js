/**
 * Analytics Controller
 * Category distribution, month-over-month, budget usage, savings goals
 */

const Expense = require('../models/Expense');
const User = require('../models/User');

/**
 * Get start/end of month for given year and month
 */
const getMonthBounds = (year, month) => {
  const y = year || new Date().getFullYear();
  const m = month || new Date().getMonth() + 1;
  return {
    start: new Date(y, m - 1, 1),
    end: new Date(y, m, 0, 23, 59, 59, 999),
  };
};

/**
 * @route   GET /api/analytics/category-distribution
 * @desc    Pie chart data - category-wise expense distribution for current month
 */
const getCategoryDistribution = async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const y = year ? parseInt(year, 10) : now.getFullYear();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    const { start, end } = getMonthBounds(y, m);

    const data = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);

    const chartData = data.map((d) => ({
      name: d._id,
      value: d.total,
    }));

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/**
 * @route   GET /api/analytics/monthly-comparison
 * @desc    Bar chart - month-over-month expense comparison (last 6 months)
 */
const getMonthlyComparison = async (req, res) => {
  try {
    const now = new Date();
    const months = [];
    const labels = [];
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
      labels.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
    }

    const results = await Promise.all(
      months.map(({ year, month }) => {
        const { start, end } = getMonthBounds(year, month);
        return Expense.aggregate([
          {
            $match: {
              user: req.user._id,
              date: { $gte: start, $lte: end },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
      })
    );

    const values = results.map((r) => (r[0] ? r[0].total : 0));

    res.json({ labels, values });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/**
 * @route   GET /api/analytics/budget-usage
 * @desc    Progress bars - category budget usage for current month
 */
const getBudgetUsage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { start, end } = getMonthBounds(
      new Date().getFullYear(),
      new Date().getMonth() + 1
    );

    const categoryExpenses = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } },
    ]);

    const spentMap = {};
    categoryExpenses.forEach((ce) => {
      spentMap[ce._id] = ce.spent;
    });

    const budgetUsage = (user.categoryBudgets || []).map((cb) => {
      const spent = spentMap[cb.category] || 0;
      const budget = cb.amount || 1;
      const percentage = Math.min(100, Math.round((spent / budget) * 100));
      const exceeded = spent > budget;
      return {
        category: cb.category,
        budget,
        spent,
        percentage,
        exceeded,
        remaining: Math.max(0, budget - spent),
      };
    });

    res.json(budgetUsage);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/**
 * @route   GET /api/analytics/savings-goal
 * @desc    Compare savings goal with remaining balance
 */
const getSavingsGoal = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { start, end } = getMonthBounds(
      new Date().getFullYear(),
      new Date().getMonth() + 1
    );

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
    const actualRemaining = Math.max(0, monthlyIncome - expensesSoFar);
    const goal = user.monthlySavingsGoal || 0;

    let feedback = 'Keep tracking your expenses!';
    if (goal > 0) {
      if (actualRemaining >= goal) {
        feedback = 'Congratulations! You are on track to meet your savings goal.';
      } else if (actualRemaining >= goal * 0.5) {
        feedback = 'You are halfway there. Consider reducing non-essential spending.';
      } else {
        feedback = 'Focus on cutting expenses to reach your savings goal.';
      }
    }

    res.json({
      monthlyIncome,
      expensesSoFar,
      actualRemaining,
      savingsGoal: goal,
      onTrack: actualRemaining >= goal,
      feedback,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  getCategoryDistribution,
  getMonthlyComparison,
  getBudgetUsage,
  getSavingsGoal,
};
