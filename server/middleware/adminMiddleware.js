const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');

const adminMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }

  // Check that the token belongs to an admin
  if (!decoded.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Admin access required.',
    });
  }

  // Verify the admin actually exists in the database
  const admin = await Admin.findOne({ email: decoded.email }).select('-password');
  if (!admin) {
    return res.status(403).json({
      success: false,
      message: 'Admin account not found.',
    });
  }

  req.user = decoded;
  req.admin = admin;
  next();
};

module.exports = adminMiddleware;
