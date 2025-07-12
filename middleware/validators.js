// middleware/validators.js
const { body, validationResult } = require('express-validator');

const validateBillRequest = [
  body('billType')
    .isIn(['electric', 'water', 'internet'])
    .withMessage('Bill type must be electric, water, or internet'),
  
  body('billAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Bill amount must be a positive number'),
  
  body('provider')
    .isLength({ min: 1, max: 100 })
    .withMessage('Provider name is required and must be less than 100 characters'),
  
  body('accountNumber')
    .isLength({ min: 1, max: 50 })
    .withMessage('Account number is required and must be less than 50 characters'),
  
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  
  body('paymentMethod')
    .isIn(['bank', 'crypto', 'mobile', 'other'])
    .withMessage('Payment method must be bank, crypto, mobile, or other'),
  
  body('serviceFee')
    .isFloat({ min: 0 })
    .withMessage('Service fee must be a non-negative number'),
  
  body('totalAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Total amount must be a positive number'),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateBillRequest
};