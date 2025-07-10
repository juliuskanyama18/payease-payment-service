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

module.exports = { sendEmail };