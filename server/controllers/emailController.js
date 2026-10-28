const emailService = require('../services/emailService');
const emailConfig = require('../config/emailConfig');
const Booking = require('../models/bookingModel');

// @desc    Test Brevo Email Configuration & Delivery
// @route   POST /api/email/test
// @access  Public / Dev
const testEmail = async (req, res) => {
  const targetEmail = req.body.email || emailConfig.senderEmail;
  const testType = req.body.type || 'verification';

  try {
    let result;

    if (testType === 'verification') {
      result = await emailService.sendVerificationEmail(targetEmail, {
        username: 'Cinema Explorer',
        otp: Math.floor(100000 + Math.random() * 900000).toString(),
        verificationToken: 'test_token_' + Date.now(),
      });
    } else if (testType === 'reset') {
      result = await emailService.sendPasswordResetEmail(targetEmail, {
        username: 'Cinema Explorer',
        otp: Math.floor(100000 + Math.random() * 900000).toString(),
        resetToken: 'test_reset_' + Date.now(),
      });
    } else if (testType === 'booking') {
      result = await emailService.sendBookingConfirmationEmail(targetEmail, {
        bookingId: 'IMV' + Date.now(),
        movieName: 'Dune: Part Two (IMAX)',
        theatreName: 'PVR IMAX Phoenix MarketCity',
        showDate: new Date(),
        showTime: '07:30 PM',
        seats: ['B-A1', 'B-A2'],
        totalAmount: 900,
        tier: 'Balcony',
        paymentMethod: 'Razorpay',
        razorpayPaymentId: 'pay_test_' + Date.now(),
      });
    } else {
      result = await emailService.sendEmail({
        to: targetEmail,
        subject: '🎬 iMovies Brevo Integration Test',
        htmlContent: '<h1 style="color: #00a8e1;">Brevo Email Integration is Working!</h1><p>This is a test notification from the iMovies platform.</p>',
      });
    }

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Test email (${testType}) successfully dispatched to ${targetEmail}`,
        data: result,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to dispatch test email',
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[Email Controller Test Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Exception while dispatching test email',
      error: error.message,
    });
  }
};

// @desc    Resend ticket confirmation email for a booking
// @route   POST /api/email/resend-ticket
// @access  Public / User
const resendTicketEmail = async (req, res) => {
  const { bookingId, email } = req.body;

  if (!bookingId) {
    return res.status(400).json({ success: false, message: 'bookingId is required' });
  }

  const booking = await Booking.findOne({
    $or: [{ bookingId }, { _id: bookingId }],
  });

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const targetEmail = email || booking.userEmail;

  const result = await emailService.sendBookingConfirmationEmail(targetEmail, {
    bookingId: booking.bookingId || booking._id,
    movieName: booking.movieName,
    theatreName: booking.theatreName,
    showDate: booking.showDate,
    showTime: booking.showTime,
    seats: booking.selectedSeats,
    totalAmount: booking.totalAmount,
    tier: booking.tier,
    paymentMethod: booking.paymentMethod,
    razorpayPaymentId: booking.razorpayPaymentId,
  });

  if (result.success) {
    return res.status(200).json({
      success: true,
      message: `Ticket confirmation sent to ${targetEmail}`,
      data: result,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Failed to send ticket email',
    error: result.error,
  });
};

module.exports = {
  testEmail,
  resendTicketEmail,
};
