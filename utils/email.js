// utils/email.js
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
    logger.info(`Email sent to ${to}`);
  } catch (err) {
    logger.error('Email send failed:', err);
    throw err;
  }
};

// ✅ Function to send completion notification
const sendCompletionNotification = async (toEmail, fullName, request, receiptUrl) => {
  const subject = 'Your Bill Payment is Completed ✅';
  const html = `
    <h3>Hi ${fullName},</h3>
    <p>Your bill payment request has been completed successfully.</p>
    <p><strong>Provider:</strong> ${request.provider}</p>
    <p><strong>Account Number:</strong> ${request.accountNumber}</p>
    <p><strong>Total Amount Paid:</strong> ₺${request.totalAmount.toFixed(2)}</p>
    ${receiptUrl ? `<p><a href="${receiptUrl}">View Receipt</a></p>` : ''}
    <p>Thank you for using PayEase.</p>
  `;

  return sendEmail({ to: toEmail, subject, html });
};

// ✅ Export both functions
module.exports = {
  sendEmail,
  sendCompletionNotification
};
