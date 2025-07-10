// routes/billRoutes.js
const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { validateBillRequest } = require('../middleware/validators');
const sanitizeInput = require('../middleware/sanitize');

router.post('/submit-bill', validateBillRequest, sanitizeInput, billController.submitBillRequest);
router.get('/status/:requestId', billController.getBillStatus);

module.exports = router;