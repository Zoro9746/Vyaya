/**
 * User Model
 * Stores user profile, authentication data, income, and budget configuration
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const categoryBudgetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minLength: 6,
      select: false, // Don't include password in queries by default
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    googleId: {
      type: String,
      sparse: true, // Allow multiple nulls but unique non-nulls
    },
    avatar: {
      type: String,
      default: '',
    },
    // Financial configuration
    monthlyIncome: {
      type: Number,
      default: 0,
      min: 0,
    },
    plannedSpending: {
      type: Number,
      default: 0,
      min: 0,
    },
    categoryBudgets: {
      type: [categoryBudgetSchema],
      default: [],
    },
    monthlySavingsGoal: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Track if user has completed initial setup (income, budgets)
    setupCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// CRITICAL: Validate sum(categoryBudgets) <= plannedSpending before save
userSchema.pre('save', function (next) {
  if (this.categoryBudgets && this.categoryBudgets.length > 0 && this.plannedSpending != null) {
    const total = this.categoryBudgets.reduce((sum, cb) => sum + (cb.amount || 0), 0);
    if (total > this.plannedSpending) {
      return next(new Error('Total category budget cannot exceed the amount you decided to spend.'));
    }
  }
  next();
});

// Hash password before saving (only if password is modified)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for savings (income - planned spending)
userSchema.virtual('savings').get(function () {
  return Math.max(0, (this.monthlyIncome || 0) - (this.plannedSpending || 0));
});

module.exports = mongoose.model('User', userSchema);
