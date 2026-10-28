require('dotenv').config();

const emailConfig = {
  apiKey: process.env.BREVO_API_KEY || '',
  secondaryApiKey: process.env.BREVO_API_KEY_SECONDARY || '',
  senderEmail: process.env.SENDER_EMAIL || 'en24cs3010865@medicaps.ac.in',
  senderName: process.env.SENDER_NAME || 'iMovies',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

// Validate configuration
const validateConfig = () => {
  const missing = [];
  if (!emailConfig.apiKey) missing.push('BREVO_API_KEY');
  if (!emailConfig.senderEmail) missing.push('SENDER_EMAIL');
  if (!emailConfig.senderName) missing.push('SENDER_NAME');

  if (missing.length > 0) {
    console.warn(`[Brevo Config Warning] Missing email environment variables: ${missing.join(', ')}. Fallbacks will be utilized.`);
  } else {
    console.log(`[Brevo Config] Initialized successfully. Sender: "${emailConfig.senderName}" <${emailConfig.senderEmail}>`);
  }
};

validateConfig();

emailConfig.isConfigured = () => Boolean(emailConfig.apiKey && emailConfig.senderEmail);

module.exports = emailConfig;
