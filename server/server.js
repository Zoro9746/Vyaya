/**
 * Vyaya Server Entry Point
 * Personal Expense and Income Tracker API
 */

require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// 🔐 IMPORTANT: Trust Render's reverse proxy
// Required for secure cookies to work correctly
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Vyaya server running on port ${PORT}`);
});
