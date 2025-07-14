// /routes/authRoutes.js
// the login, register, and logout routes.
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const sanitizeInput = require('../middleware/sanitize');
const { forgotPassword, resetPassword } = require('../controllers/authController');

// Import user auth from authController
const {
  loginUser,
  registerUser,
  logout,
} = require('../controllers/authController');

// Import admin auth from adminController
const {
  loginAdmin,
  logoutAdmin,
} = require('../controllers/adminController');

const validateAdminLogin = [
  body('username').trim().isLength({ min: 3, max: 50 }),
  body('password').isLength({ min: 6, max: 100 })
];

const validateUserLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6, max: 100 })
];

const validateUserRegister = [
  body('fullName').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6, max: 100 })
];

// User auth routes (notice no /api/auth prefix - it's added in server.js)
router.post('/login', validateUserLogin, sanitizeInput, loginUser);
router.post('/register', validateUserRegister, sanitizeInput, registerUser);
router.post('/logout', logout);
router.post('/forgot-password', sanitizeInput, forgotPassword);
router.post('/reset-password', sanitizeInput, resetPassword);

// Admin auth routes
router.post('/admin/login', validateAdminLogin, sanitizeInput, loginAdmin);
router.post('/admin/logout', logoutAdmin);

module.exports = router;