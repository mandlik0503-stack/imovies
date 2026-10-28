const https = require('https');
const emailConfig = require('../config/emailConfig');

let BrevoClientInstance = null;

try {
  const brevoPackage = require('@getbrevo/brevo');
  if (brevoPackage.BrevoClient) {
    BrevoClientInstance = new brevoPackage.BrevoClient({ apiKey: emailConfig.apiKey });
  } else if (brevoPackage.TransactionalEmailsApi) {
    const api = new brevoPackage.TransactionalEmailsApi();
    api.setApiKey(brevoPackage.TransactionalEmailsApiApiKeys.apiKey, emailConfig.apiKey);
    BrevoClientInstance = {
      transactionalEmails: {
        sendTransacEmail: (req) => api.sendTransacEmail(req),
      },
    };
  }
} catch (err) {
  console.warn('[Brevo SDK] Notice: Using direct HTTPS REST client for email delivery:', err.message);
}

/**
 * Direct HTTPS fallback to Brevo REST API v3
 */
const sendViaRestApi = (apiKey, payload) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve({ messageId: body });
          }
        } else {
          let parsed;
          try { parsed = JSON.parse(body); } catch { parsed = { message: body }; }
          const error = new Error(parsed.message || `Brevo API HTTP ${res.statusCode}`);
          error.statusCode = res.statusCode;
          error.body = parsed;
          reject(error);
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Brevo API request timed out (10s)'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
};

/**
 * Base method: Send transactional email with retry and key fallback
 */
const sendEmail = async ({ to, subject, htmlContent, textContent, replyTo }) => {
  if (!emailConfig.isConfigured()) {
    console.warn('[Brevo Service] Email not fully configured. Skipping delivery.');
    return { success: false, message: 'Email service not configured' };
  }

  const recipients = Array.isArray(to)
    ? to.map((r) => (typeof r === 'string' ? { email: r } : r))
    : [{ email: to }];

  const payload = {
    sender: {
      name: emailConfig.senderName,
      email: emailConfig.senderEmail,
    },
    to: recipients,
    subject,
    htmlContent,
    textContent: textContent || subject,
  };

  if (replyTo) {
    payload.replyTo = typeof replyTo === 'string' ? { email: replyTo } : replyTo;
  }

  const apiKeysToTry = [emailConfig.apiKey, emailConfig.secondaryApiKey].filter(Boolean);

  let lastError = null;

  for (let i = 0; i < apiKeysToTry.length; i++) {
    const currentKey = apiKeysToTry[i];

    try {
      // 1. Try Brevo SDK if available and on first attempt
      if (BrevoClientInstance && i === 0) {
        try {
          const sdkRes = await BrevoClientInstance.transactionalEmails.sendTransacEmail(payload);
          console.log(`[Brevo Service] Email sent successfully via SDK to ${recipients[0].email} (MessageId: ${sdkRes?.messageId || 'sent'})`);
          return { success: true, messageId: sdkRes?.messageId, provider: 'sdk' };
        } catch (sdkErr) {
          console.warn('[Brevo SDK Warning] SDK delivery failed, falling back to direct REST:', sdkErr.message);
        }
      }

      // 2. Direct HTTPS REST delivery
      const restRes = await sendViaRestApi(currentKey, payload);
      console.log(`[Brevo Service] Email sent successfully via REST to ${recipients[0].email} (MessageId: ${restRes?.messageId || 'sent'})`);
      return { success: true, messageId: restRes?.messageId, provider: 'rest' };
    } catch (err) {
      lastError = err;
      console.warn(`[Brevo Service] Delivery attempt ${i + 1} failed with key: ${err.message}`);

      // Handle 429 Rate Limit - wait 1s before retry
      if (err.statusCode === 429 && i < apiKeysToTry.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  console.error('[Brevo Service Error] All email delivery attempts failed:', lastError?.message);
  return {
    success: false,
    error: lastError?.message,
    statusCode: lastError?.statusCode,
  };
};

/**
 * Base method: Send template-based email
 */
const sendTemplateEmail = async ({ to, templateId, params }) => {
  const recipients = Array.isArray(to)
    ? to.map((r) => (typeof r === 'string' ? { email: r } : r))
    : [{ email: to }];

  const payload = {
    sender: { name: emailConfig.senderName, email: emailConfig.senderEmail },
    to: recipients,
    templateId: Number(templateId),
    params: params || {},
  };

  try {
    const res = await sendViaRestApi(emailConfig.apiKey, payload);
    return { success: true, messageId: res.messageId };
  } catch (err) {
    console.error('[Brevo Template Error]:', err.message);
    return { success: false, error: err.message };
  }
};

// -------------------------------------------------------------
// Amazon Prime Video Branded HTML Templates
// -------------------------------------------------------------

const wrapInPrimeLayout = (title, bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1116; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b1116; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #0f171e; border: 1px solid #1a242f; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
          <!-- Prime Brand Header -->
          <tr>
            <td style="padding: 24px 32px; background: linear-gradient(90deg, #0f171e 0%, #1a242f 100%); border-bottom: 2px solid #00a8e1;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">i<span style="color: #00a8e1;">Movies</span></span>
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8197a4; margin-left: 8px; font-weight: 600;">Cinema Experience</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background: #00a8e1; color: #0f171e; font-weight: 800; font-size: 10px; padding: 4px 10px; border-radius: 4px; letter-spacing: 1px; text-transform: uppercase;">Verified</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px; background-color: #0f171e;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Prime Brand Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0a0f14; border-top: 1px solid #1a242f; text-align: center; color: #8197a4; font-size: 12px; line-height: 18px;">
              <p style="margin: 0 0 8px 0; color: #c0cdd5; font-weight: 600;">iMovies Ticket Booking Platform</p>
              <p style="margin: 0 0 12px 0;">Premium IMAX & Tier-Based Cinema Reservations</p>
              <p style="margin: 0; font-size: 11px; color: #586976;">
                This is an automated notification from iMovies. If you did not request this, please secure your account immediately.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * 1. Send Account Verification Email (Link + 6-digit OTP)
 */
const sendVerificationEmail = async (email, { verificationToken, verificationLink, otp, username }) => {
  const userGreeting = username ? `Hi ${username},` : 'Hello Cinema Lover,';
  const link = verificationLink || `${emailConfig.clientUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
  const displayOtp = otp || '123456';

  const bodyContent = `
    <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 16px 0;">Verify Your Email Address</h1>
    <p style="color: #c0cdd5; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;">
      ${userGreeting}<br>
      Welcome to <strong>iMovies</strong>! To activate your account and start booking cinema tickets, please verify your email using either the 6-digit One-Time Password (OTP) or the verification button below.
    </p>

    <!-- OTP Display Box -->
    <div style="background-color: #1a242f; border: 1px solid #253241; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 28px;">
      <p style="color: #8197a4; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0; font-weight: 700;">
        Your 6-Digit One-Time Password (OTP)
      </p>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #00a8e1; padding: 10px 0;">
        ${displayOtp}
      </div>
      <p style="color: #8197a4; font-size: 12px; margin: 8px 0 0 0;">
        ⏰ Valid for <strong>15 minutes</strong>. Do not share this code with anyone.
      </p>
    </div>

    <!-- Direct Verification Button -->
    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${link}" target="_blank" style="display: inline-block; background-color: #00a8e1; color: #0f171e; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 36px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0, 168, 225, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
        Verify Email Address
      </a>
    </div>

    <p style="color: #8197a4; font-size: 12px; line-height: 18px; margin: 0; border-top: 1px solid #1a242f; padding-top: 20px;">
      If the button above does not work, copy and paste this verification URL into your web browser:<br>
      <a href="${link}" style="color: #00a8e1; word-break: break-all; text-decoration: underline;">${link}</a>
    </p>
  `;

  return await sendEmail({
    to: email,
    subject: `🎬 Your iMovies Verification Code: ${displayOtp}`,
    htmlContent: wrapInPrimeLayout('Verify Your iMovies Account', bodyContent),
    textContent: `Your iMovies verification OTP is ${displayOtp}. Or visit ${link} to verify your account.`,
  });
};

/**
 * 2. Send Password Reset Email (Link + 6-digit OTP)
 */
const sendPasswordResetEmail = async (email, { resetToken, resetLink, otp, username }) => {
  const userGreeting = username ? `Hi ${username},` : 'Hello,';
  const link = resetLink || `${emailConfig.clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  const displayOtp = otp || '123456';

  const bodyContent = `
    <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 16px 0;">Reset Your Password</h1>
    <p style="color: #c0cdd5; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;">
      ${userGreeting}<br>
      We received a request to reset the password for your <strong>iMovies</strong> account. Use the 6-digit code or click the secure link below to create a new password.
    </p>

    <!-- OTP Display Box -->
    <div style="background-color: #1a242f; border: 1px solid #253241; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 28px;">
      <p style="color: #8197a4; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0; font-weight: 700;">
        Your Password Reset Code (OTP)
      </p>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #00a8e1; padding: 10px 0;">
        ${displayOtp}
      </div>
      <p style="color: #8197a4; font-size: 12px; margin: 8px 0 0 0;">
        ⏰ Valid for <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
      </p>
    </div>

    <!-- Direct Reset Button -->
    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${link}" target="_blank" style="display: inline-block; background-color: #00a8e1; color: #0f171e; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 36px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0, 168, 225, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
        Reset Password
      </a>
    </div>

    <p style="color: #8197a4; font-size: 12px; line-height: 18px; margin: 0; border-top: 1px solid #1a242f; padding-top: 20px;">
      Reset link: <a href="${link}" style="color: #00a8e1; word-break: break-all; text-decoration: underline;">${link}</a>
    </p>
  `;

  return await sendEmail({
    to: email,
    subject: `🔐 iMovies Password Reset Code: ${displayOtp}`,
    htmlContent: wrapInPrimeLayout('Reset Your iMovies Password', bodyContent),
    textContent: `Your iMovies password reset OTP is ${displayOtp}. Or visit ${link} to reset your password.`,
  });
};

/**
 * 3. Send Booking Confirmation Email (Full Digital Cinema Ticket Receipt)
 */
const sendBookingConfirmationEmail = async (email, bookingDetails) => {
  const {
    bookingId,
    movieName,
    theatreName,
    showDate,
    showTime,
    seats,
    selectedSeats,
    totalAmount,
    tier,
    paymentMethod,
    razorpayPaymentId,
  } = bookingDetails;

  const displaySeats = (seats || selectedSeats || []).join(', ') || 'Seats Reserved';
  const displayDate = showDate
    ? new Date(showDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : 'Upcoming Show';
  const displayAmount = totalAmount != null ? `₹${totalAmount}` : 'Paid';
  const displayRef = (bookingId || '').slice(-10).toUpperCase() || 'IMV-TICKET';

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.4); color: #4ade80; font-size: 12px; font-weight: 700; padding: 6px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
        ✓ Booking Confirmed & Paid
      </span>
      <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; margin: 16px 0 6px 0;">${movieName || 'Movie Ticket'}</h1>
      <p style="color: #8197a4; font-size: 14px; margin: 0;">${theatreName || 'PVR IMAX Phoenix MarketCity'}</p>
    </div>

    <!-- Digital Ticket Card -->
    <div style="background: linear-gradient(180deg, #1a242f 0%, #151d26 100%); border: 1px solid #253241; border-radius: 12px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);">
      <!-- Top Accent Banner -->
      <div style="background: linear-gradient(90deg, #00a8e1, #0891c9); padding: 10px 20px; color: #ffffff; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
        🎟️ Digital Cinema Pass
      </div>

      <!-- Details Grid -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding: 20px;">
        <tr>
          <td style="padding: 8px 12px; width: 50%;">
            <span style="font-size: 11px; text-transform: uppercase; color: #8197a4; letter-spacing: 1px; display: block; margin-bottom: 4px;">Date</span>
            <strong style="color: #ffffff; font-size: 14px;">${displayDate}</strong>
          </td>
          <td style="padding: 8px 12px; width: 50%;">
            <span style="font-size: 11px; text-transform: uppercase; color: #8197a4; letter-spacing: 1px; display: block; margin-bottom: 4px;">Show Time</span>
            <strong style="color: #ffffff; font-size: 14px;">${showTime || '07:30 PM'}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 12px;">
            <span style="font-size: 11px; text-transform: uppercase; color: #8197a4; letter-spacing: 1px; display: block; margin-bottom: 4px;">Tier</span>
            <span style="display: inline-block; background: #253241; color: #00a8e1; font-weight: 700; font-size: 12px; padding: 2px 8px; border-radius: 4px;">${tier || 'Balcony'}</span>
          </td>
          <td style="padding: 8px 12px;">
            <span style="font-size: 11px; text-transform: uppercase; color: #8197a4; letter-spacing: 1px; display: block; margin-bottom: 4px;">Reserved Seats</span>
            <strong style="color: #00a8e1; font-size: 15px; font-family: monospace;">${displaySeats}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border-top: 1px dashed #253241;">
            <span style="font-size: 11px; text-transform: uppercase; color: #8197a4; letter-spacing: 1px; display: block; margin-bottom: 4px;">Total Paid</span>
            <strong style="color: #00a8e1; font-size: 18px; font-weight: 900;">${displayAmount}</strong>
          </td>
          <td style="padding: 8px 12px; border-top: 1px dashed #253241;">
            <span style="font-size: 11px; text-transform: uppercase; color: #8197a4; letter-spacing: 1px; display: block; margin-bottom: 4px;">Payment Gateway</span>
            <strong style="color: #ffffff; font-size: 13px;">${paymentMethod || 'Razorpay'}</strong>
          </td>
        </tr>
      </table>

      <!-- Barcode / Reference Strip -->
      <div style="background-color: #0f171e; border-top: 1px dashed #253241; padding: 14px 20px; text-align: center;">
        <p style="color: #8197a4; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 6px 0;">Booking Reference ID</p>
        <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: 4px;">
          ${displayRef}
        </div>
        ${razorpayPaymentId ? `<p style="color: #00a8e1; font-size: 11px; font-family: monospace; margin: 6px 0 0 0;">Transaction: ${razorpayPaymentId}</p>` : ''}
      </div>
    </div>

    <!-- Quick action button -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${emailConfig.clientUrl}/bookings" target="_blank" style="display: inline-block; background-color: #00a8e1; color: #0f171e; font-size: 14px; font-weight: 800; text-decoration: none; padding: 12px 30px; border-radius: 8px; text-transform: uppercase;">
        View Ticket in iMovies
      </a>
    </div>

    <p style="color: #8197a4; font-size: 12px; line-height: 18px; text-align: center; margin: 0;">
      Please present this email or the ticket on your mobile device at the cinema entrance counter. Have a wonderful show! 🍿
    </p>
  `;

  return await sendEmail({
    to: email,
    subject: `🎟️ Ticket Confirmed: ${movieName || 'Movie'} at ${theatreName || 'iMovies'} (${displaySeats})`,
    htmlContent: wrapInPrimeLayout('Your iMovies Ticket Confirmation', bodyContent),
    textContent: `Your booking for ${movieName} (${displaySeats}) is confirmed! Booking ID: ${displayRef}. Total: ${displayAmount}.`,
  });
};

/**
 * 4. Send Booking Status Update Email (e.g. Cancelled, Updated)
 */
const sendBookingStatusUpdateEmail = async (email, statusDetails) => {
  const {
    bookingId,
    movieName,
    theatreName,
    status = 'Cancelled',
    reason,
    refundAmount,
  } = statusDetails;

  const displayRef = (bookingId || '').slice(-10).toUpperCase() || 'IMV-TICKET';
  const isCancelled = status.toLowerCase() === 'cancelled';
  const badgeColor = isCancelled ? '#ef4444' : '#00a8e1';
  const badgeBg = isCancelled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 168, 225, 0.15)';

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background: ${badgeBg}; border: 1px solid ${badgeColor}; color: ${badgeColor}; font-size: 12px; font-weight: 700; padding: 6px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
        ${status}
      </span>
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 16px 0 6px 0;">Booking Update: ${movieName || 'Cinema Reservation'}</h1>
      <p style="color: #8197a4; font-size: 14px; margin: 0;">Reference ID: <strong style="color: #ffffff;">${displayRef}</strong></p>
    </div>

    <div style="background-color: #1a242f; border: 1px solid #253241; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
      <p style="color: #c0cdd5; font-size: 14px; line-height: 22px; margin: 0 0 12px 0;">
        ${isCancelled
          ? 'Your booking has been cancelled and your reserved seats have been released back to the seating inventory.'
          : `The status of your booking has been updated to: <strong>${status}</strong>.`}
      </p>
      ${reason ? `<p style="color: #8197a4; font-size: 13px; margin: 0 0 8px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
      ${refundAmount ? `<p style="color: #00a8e1; font-size: 14px; font-weight: 700; margin: 0;">Refund Amount: ₹${refundAmount}</p>` : ''}
    </div>

    <div style="text-align: center;">
      <a href="${emailConfig.clientUrl}/home" target="_blank" style="display: inline-block; background-color: #00a8e1; color: #0f171e; font-size: 14px; font-weight: 800; text-decoration: none; padding: 12px 28px; border-radius: 8px; text-transform: uppercase;">
        Explore Other Movies
      </a>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: `📢 Booking Status Update: ${movieName || 'Reservation'} is ${status}`,
    htmlContent: wrapInPrimeLayout(`Booking ${status}`, bodyContent),
    textContent: `Your booking ${displayRef} for ${movieName} has been ${status}.`,
  });
};

module.exports = {
  sendEmail,
  sendTemplateEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingStatusUpdateEmail,
};
