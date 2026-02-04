/**
 * Budget Validation Utility
 * CRITICAL: Enforces that sum(categoryBudgets.amount) <= plannedSpending
 */

/**
 * Validates that total category budgets do not exceed planned spending
 * @param {number} plannedSpending - The amount user decided to spend
 * @param {Array<{category: string, amount: number}>} categoryBudgets - Category-wise allocations
 * @returns {{ valid: boolean, message?: string }}
 */
const validateCategoryBudgets = (plannedSpending, categoryBudgets) => {
  if (!categoryBudgets || !Array.isArray(categoryBudgets)) {
    return { valid: true }; // No budgets to validate
  }

  const totalCategoryBudget = categoryBudgets.reduce((sum, cb) => sum + (cb.amount || 0), 0);

  if (totalCategoryBudget > plannedSpending) {
    return {
      valid: false,
      message: 'Total category budget cannot exceed the amount you decided to spend.',
    };
  }

  return { valid: true };
};

module.exports = {
  validateCategoryBudgets,
};
