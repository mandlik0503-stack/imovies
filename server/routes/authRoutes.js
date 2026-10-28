const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  registerAdmin,
  loginAdmin,
  getMe,
  validateToken,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// User auth routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Admin auth routes (supports both /admin/login and /adminlogin)
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);
router.post('/adminregister', registerAdmin);
router.post('/adminlogin', loginAdmin);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.post('/validate', validateToken);

module.exports = router;
