// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { validateBillRequest } = require('../middleware/validators');
const sanitizeInput = require('../middleware/sanitize');

// All user routes require authentication
router.use(authenticateToken);

// User profile routes
router.get('/profile', userController.getUserProfile);
router.put('/profile', sanitizeInput, userController.updateUserProfile);

// User bills routes
router.get('/bills', userController.getUserBills);
router.post('/bills', validateBillRequest, sanitizeInput, userController.createUserBill);
router.get('/bills/:billId', userController.getUserBillById);

module.exports = router;