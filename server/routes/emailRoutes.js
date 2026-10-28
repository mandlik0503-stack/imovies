const express = require('express');
const router = express.Router();
const { testEmail, resendTicketEmail } = require('../controllers/emailController');

// Test & diagnostics endpoint
router.post('/test', testEmail);

// Ticket resend endpoint
router.post('/resend-ticket', resendTicketEmail);

module.exports = router;
