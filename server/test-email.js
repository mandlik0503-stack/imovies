require('dotenv').config();
const emailService = require('./services/emailService');
const emailConfig = require('./config/emailConfig');

const runEmailTests = async () => {
  console.log('====================================================');
  console.log('🚀 iMovies Brevo Transactional Email Integration Test');
  console.log('====================================================');
  console.log('Configured Sender:', `${emailConfig.senderName} <${emailConfig.senderEmail}>`);
  console.log('Target Test Recipient:', emailConfig.senderEmail);

  const testRecipient = emailConfig.senderEmail;

  try {
    // Test 1: Account Verification Email (OTP + Direct Link)
    console.log('\n[1/3] Testing sendVerificationEmail with 6-digit OTP...');
    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const verifRes = await emailService.sendVerificationEmail(testRecipient, {
      username: 'Alex Explorer',
      otp: testOtp,
      verificationToken: 'test_token_' + Date.now(),
    });
    console.log('✓ Verification Email Result:', verifRes);

    // Test 2: Password Reset Email (OTP + Link)
    console.log('\n[2/3] Testing sendPasswordResetEmail...');
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetRes = await emailService.sendPasswordResetEmail(testRecipient, {
      username: 'Alex Explorer',
      otp: resetOtp,
      resetToken: 'reset_token_' + Date.now(),
    });
    console.log('✓ Password Reset Email Result:', resetRes);

    // Test 3: Booking Confirmation Email (Digital Cinema Pass)
    console.log('\n[3/3] Testing sendBookingConfirmationEmail...');
    const bookRes = await emailService.sendBookingConfirmationEmail(testRecipient, {
      bookingId: 'IMV' + Date.now().toString().slice(-8),
      movieName: 'Interstellar: 10th Anniversary IMAX Re-Release',
      theatreName: 'PVR IMAX Phoenix MarketCity',
      showDate: new Date(),
      showTime: '08:15 PM',
      seats: ['B-A1', 'B-A2'],
      totalAmount: 1100,
      tier: 'Balcony',
      paymentMethod: 'Razorpay (Test Mode)',
      razorpayPaymentId: 'pay_test_' + Math.random().toString(36).substring(2, 9),
    });
    console.log('✓ Booking Confirmation Email Result:', bookRes);

    console.log('\n====================================================');
    console.log('🎉 All Brevo transactional email test flows completed!');
    console.log('====================================================');
  } catch (error) {
    console.error('\n❌ Test script error:', error.message);
  }
};

runEmailTests();
