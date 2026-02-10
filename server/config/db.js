/**
 * MongoDB Database Configuration
 * Connects to MongoDB Atlas for cloud-based multi-device sync
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected:', conn.connection.host);
    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error; // Let server.js handle exit (fail-fast, no silent crash)
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

module.exports = connectDB;
