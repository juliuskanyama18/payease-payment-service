// middleware/validators.js
// This file contains validation middleware for user and admin login, as well as bill request submissions.
// It uses express-validator to ensure that the input data meets the required criteria before processing.
const { body } = require('express-validator');

const validateUserLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
];

const validateAdminLogin = [
  body('username').notEmpty().withMessage('Username required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
];

const validateBillRequest = [
  body('fullName').trim().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail(),
  body('billType').isIn(['electric', 'water', 'internet']),
  body('billAmount').isFloat({ min: 0.01 }),
  body('provider').notEmpty(),
  body('accountNumber').notEmpty(),
  body('dueDate').isISO8601(),
  body('paymentMethod').isIn(['bank', 'crypto', 'mobile', 'other'])
];

module.exports = { validateUserLogin, validateAdminLogin, validateBillRequest };