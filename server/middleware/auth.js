/**
 * Authentication Middleware
 * Protects API routes using JWT stored in HTTP-only cookies
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT from cookies and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    // 🔐 Read token from HTTP-only cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (excluding password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    return res.status(401).json({ message: 'Not authorized' });
  }
};

module.exports = { protect };
