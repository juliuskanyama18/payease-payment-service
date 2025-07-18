// routes/adminRoutes.js
const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Public Routes (no authentication needed)
// Admin Login
router.post(
  '/login',
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    body('password').isLength({ min: 6, max: 100 }).withMessage('Password must be between 6 and 100 characters')
  ],
  adminController.loginAdmin
);

// Admin Logout
router.post('/logout', adminController.logoutAdmin);

// Protected Routes (authentication required)
router.get('/requests', adminAuth, adminController.getAllRequests);
router.put('/requests/:requestId/status', adminAuth, adminController.updateRequestStatus);
router.get('/stats', adminAuth, adminController.getStats);

module.exports = router;