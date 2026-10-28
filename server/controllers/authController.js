const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');
const emailService = require('../services/emailService');

// Helper: generate JWT
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Helper: generate 6-digit numeric OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register a new user (Requires email OTP verification)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: username.trim() }],
  });

  const otp = generateOtp();
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  if (existingUser) {
    // If user exists and is already verified
    if (existingUser.isVerified) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === normalizedEmail
          ? 'An account with this email is already registered and verified. Please log in.'
          : 'Username already taken.',
      });
    }

    // User exists but has NOT verified yet: update OTP and resend email
    existingUser.emailVerificationOtp = otp;
    existingUser.emailVerificationToken = verificationToken;
    existingUser.emailVerificationExpires = expiresAt;
    if (password) {
      existingUser.password = password; // pre-save will re-hash
    }
    await existingUser.save();

    // Trigger Brevo verification email
    emailService
      .sendVerificationEmail(normalizedEmail, {
        username: existingUser.username,
        otp,
        verificationToken,
      })
      .catch((err) => console.error('[Brevo Register Error]:', err.message));

    return res.status(200).json({
      success: true,
      requiresVerification: true,
      email: normalizedEmail,
      message: 'A fresh 6-digit verification code has been sent to your email. Please verify to activate your account.',
    });
  }

  // Create new unverified user
  const user = await User.create({
    username: username.trim(),
    email: normalizedEmail,
    password,
    isVerified: false,
    emailVerificationOtp: otp,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: expiresAt,
  });

  // Trigger Brevo verification email
  emailService
    .sendVerificationEmail(normalizedEmail, {
      username: user.username,
      otp,
      verificationToken,
    })
    .catch((err) => console.error('[Brevo Register Error]:', err.message));

  return res.status(201).json({
    success: true,
    requiresVerification: true,
    email: normalizedEmail,
    message: 'Account created! We have sent a 6-digit verification code to your email. Please enter it to activate your account.',
  });
};

// @desc    Verify email using 6-digit OTP or link token
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  const { email, otp, token } = req.body;

  if (!email && !token) {
    return res.status(400).json({
      success: false,
      message: 'Email and verification code (or verification token) are required.',
    });
  }

  let user = null;
  if (email) {
    user = await User.findOne({ email: email.toLowerCase().trim() });
  } else if (token) {
    user = await User.findOne({ emailVerificationToken: token.trim() });
  }

  if (!user) {
    return res.status(404).json({ success: false, message: 'User account not found.' });
  }

  if (user.isVerified) {
    const jwtToken = generateToken({
      id: user._id,
      email: user.email,
      username: user.username,
      isAdmin: false,
    });
    return res.status(200).json({
      success: true,
      message: 'Account is already verified. Logging in...',
      token: jwtToken,
      user: { id: user._id, username: user.username, email: user.email, isAdmin: false },
    });
  }

  // Check expiration
  if (user.emailVerificationExpires && new Date(user.emailVerificationExpires) < new Date()) {
    return res.status(400).json({
      success: false,
      requiresVerification: true,
      email: user.email,
      message: 'Verification code has expired. Please request a new code.',
    });
  }

  // Verify match with either OTP or link token
  const otpMatches = otp && user.emailVerificationOtp && user.emailVerificationOtp.trim() === String(otp).trim();
  const tokenMatches = token && user.emailVerificationToken && user.emailVerificationToken.trim() === String(token).trim();

  if (!otpMatches && !tokenMatches) {
    return res.status(400).json({
      success: false,
      message: 'Invalid 6-digit verification code. Please check your email and try again.',
    });
  }

  // Successful verification
  user.isVerified = true;
  user.emailVerificationOtp = null;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  const jwtToken = generateToken({
    id: user._id,
    email: user.email,
    username: user.username,
    isAdmin: false,
  });

  return res.status(200).json({
    success: true,
    message: '🎉 Email successfully verified! Welcome to iMovies.',
    token: jwtToken,
    user: { id: user._id, username: user.username, email: user.email, isAdmin: false },
  });
};

// @desc    Resend verification email & OTP
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return res.status(404).json({ success: false, message: 'No account found with this email.' });
  }

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: 'Account is already verified. Please sign in.',
    });
  }

  const otp = generateOtp();
  const verificationToken = crypto.randomBytes(32).toString('hex');

  user.emailVerificationOtp = otp;
  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  await emailService.sendVerificationEmail(normalizedEmail, {
    username: user.username,
    otp,
    verificationToken,
  });

  return res.status(200).json({
    success: true,
    message: 'A fresh 6-digit verification code has been dispatched to your email.',
  });
};

// @desc    Login user (Blocks unverified users and triggers fresh OTP)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  // Check email verification gate
  if (!user.isVerified) {
    const otp = generateOtp();
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationOtp = otp;
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    emailService
      .sendVerificationEmail(user.email, {
        username: user.username,
        otp,
        verificationToken,
      })
      .catch((err) => console.error('[Brevo Login OTP Error]:', err.message));

    return res.status(403).json({
      success: false,
      requiresVerification: true,
      email: user.email,
      message: 'Your email address is not verified yet. We have just emailed you a fresh 6-digit verification code.',
    });
  }

  const token = generateToken({
    id: user._id,
    email: user.email,
    username: user.username,
    isAdmin: false,
  });

  const userData = { id: user._id, username: user.username, email: user.email, isAdmin: false };

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: { token, user: userData },
    token,
    user: userData,
  });
};

// @desc    Initiate password recovery (Sends OTP + Reset Link)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No account found with this email address.',
    });
  }

  const otp = generateOtp();
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  user.resetPasswordOtp = otp;
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = expiresAt;
  await user.save();

  await emailService.sendPasswordResetEmail(normalizedEmail, {
    username: user.username,
    otp,
    resetToken,
  });

  return res.status(200).json({
    success: true,
    message: 'A 6-digit password reset OTP and reset link have been dispatched to your email.',
  });
};

// @desc    Reset password using OTP or reset token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { email, otp, token, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long.',
    });
  }

  if (!email && !token) {
    return res.status(400).json({
      success: false,
      message: 'Email and 6-digit OTP (or reset token) are required.',
    });
  }

  let user = null;
  if (email) {
    user = await User.findOne({ email: email.toLowerCase().trim() });
  } else if (token) {
    user = await User.findOne({ resetPasswordToken: token.trim() });
  }

  if (!user) {
    return res.status(404).json({ success: false, message: 'User account not found.' });
  }

  // Check expiration
  if (user.resetPasswordExpires && new Date(user.resetPasswordExpires) < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'Password reset code has expired. Please request a new one.',
    });
  }

  const otpMatches = otp && user.resetPasswordOtp && user.resetPasswordOtp.trim() === String(otp).trim();
  const tokenMatches = token && user.resetPasswordToken && user.resetPasswordToken.trim() === String(token).trim();

  if (!otpMatches && !tokenMatches) {
    return res.status(400).json({
      success: false,
      message: 'Invalid password reset code or link token.',
    });
  }

  // Update password (pre-save hook will hash)
  user.password = newPassword;
  user.resetPasswordOtp = null;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  // If user wasn't verified, reset also proves email ownership
  user.isVerified = true;
  await user.save();

  return res.status(200).json({
    success: true,
    message: '🔒 Password has been reset successfully! You can now log in with your new password.',
  });
};

// @desc    Register a new admin
// @route   POST /api/auth/admin/register
// @access  Public
const registerAdmin = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
  if (existingAdmin) {
    return res.status(409).json({
      success: false,
      message: existingAdmin.email === email ? 'Admin email already registered.' : 'Admin username already taken.',
    });
  }

  const admin = await Admin.create({ username, email, password });

  const token = generateToken({ id: admin._id, email: admin.email, username: admin.username, isAdmin: true });

  const adminData = { id: admin._id, username: admin.username, email: admin.email, isAdmin: true };

  res.status(201).json({
    success: true,
    message: 'Admin registered successfully.',
    data: { token, user: adminData, admin: adminData },
    token,
    user: adminData,
    admin: adminData,
  });
};

// @desc    Login admin
// @route   POST /api/auth/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
  }

  const token = generateToken({ id: admin._id, email: admin.email, username: admin.username, isAdmin: true });

  const adminData = { id: admin._id, username: admin.username, email: admin.email, isAdmin: true };

  res.status(200).json({
    success: true,
    message: 'Admin login successful.',
    data: { token, user: adminData, admin: adminData },
    token,
    user: adminData,
    admin: adminData,
  });
};

// @desc    Get current logged-in user/admin info
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const { id, email, username, isAdmin } = req.user;

  res.status(200).json({
    success: true,
    data: { id, email, username, isAdmin },
  });
};

// @desc    Validate a JWT token
// @route   POST /api/auth/validate
// @access  Public
const validateToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    res.status(200).json({
      success: true,
      data: { valid: true, user: decoded },
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      data: { valid: false, message: 'Token is invalid or expired.' },
    });
  }
};

module.exports = {
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
};
