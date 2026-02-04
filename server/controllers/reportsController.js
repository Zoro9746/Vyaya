/**
 * Reports Controller
 * PDF and Excel export of analytics
 */

const Expense = require('../models/Expense');
const User = require('../models/User');

/**
 * Get month bounds
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
 * @route   GET /api/reports/data
 * @desc    Get full report data for current month (used by PDF/Excel generators)
 */
const getReportData = async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const y = year ? parseInt(year, 10) : now.getFullYear();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    const { start, end } = getMonthBounds(y, m);

    const user = await User.findById(req.user._id);

    const [expenses, categoryAgg] = await Promise.all([
      Expense.find({
        user: req.user._id,
        date: { $gte: start, $lte: end },
      }).sort({ date: -1 }),
      Expense.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: start, $lte: end },
          },
        },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const savings = Math.max(0, (user.monthlyIncome || 0) - (user.plannedSpending || 0));
    const remaining = Math.max(0, (user.plannedSpending || 0) - totalExpenses);

    const report = {
      user: {
        name: user.name,
        email: user.email,
      },
      period: { month: m, year: y },
      summary: {
        monthlyIncome: user.monthlyIncome,
        plannedSpending: user.plannedSpending,
        totalExpenses,
        savings,
        remaining,
      },
      categoryBreakdown: categoryAgg,
      transactions: expenses,
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/**
 * @route   GET /api/reports/excel
 * @desc    Generate Excel file - returns JSON for client-side Excel generation
 * Client can use xlsx library to create actual file from this data
 */
const getExcelData = async (req, res) => {
  try {
    const report = await fetchReportData(req);
    // Return structured data - frontend will use SheetJS/xlsx to create file
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

async function fetchReportData(req) {
  const { month, year } = req.query;
  const now = new Date();
  const y = year ? parseInt(year, 10) : now.getFullYear();
  const m = month ? parseInt(month, 10) : now.getMonth() + 1;
  const { start, end } = getMonthBounds(y, m);

  const user = await User.findById(req.user._id);

  const [expenses, categoryAgg] = await Promise.all([
    Expense.find({
      user: req.user._id,
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 }),
    Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),
  ]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const savings = Math.max(0, (user.monthlyIncome || 0) - (user.plannedSpending || 0));
  const remaining = Math.max(0, (user.plannedSpending || 0) - totalExpenses);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return {
    summary: [
      ['Vyaya Expense Report', ''],
      ['Period', `${monthNames[m - 1]} ${y}`],
      ['User', user.name],
      [''],
      ['Summary', ''],
      ['Monthly Income', user.monthlyIncome],
      ['Planned Spending', user.plannedSpending],
      ['Total Expenses', totalExpenses],
      ['Savings', savings],
      ['Remaining', remaining],
      [''],
      ['Category Breakdown', ''],
      ['Category', 'Amount'],
      ...categoryAgg.map((c) => [c._id, c.total]),
      [''],
      ['Transactions', ''],
      ['Date', 'Category', 'Amount', 'Description'],
      ...expenses.map((e) => [
        new Date(e.date).toLocaleDateString(),
        e.category,
        e.amount,
        e.description || '',
      ]),
    ],
  };
}

module.exports = {
  getReportData,
  getExcelData,
};
