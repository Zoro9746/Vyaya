/**
 * JWT Token Generation Utility
 * ----------------------------
 * Generates a JWT and attaches it as an HTTP-only cookie.
 * This approach is secure, mobile-friendly, and works with Google OAuth.
 */

const jwt = require('jsonwebtoken');

/**
 * Generate JWT token and set it as a cookie
 * @param {object} res - Express response object
 * @param {string} userId - MongoDB user ID
 */
const generateToken = (res, userId) => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );

  // Attach JWT as an HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,       // Prevent JS access (XSS protection)
    secure: true,         // Required for HTTPS (Render)
    sameSite: 'None',     // Required for cross-site & mobile browsers
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

module.exports = generateToken;
