// controllers/billController.js
//submitBillRequest: For submitting a bill request.
//getUserBillRequests: For fetching requests for a specific user.
//sendPaymentInstructions: For sending payment instructions related to a bill request.
//getAllBillRequests: For fetching all bill requests in the system.
const BillRequest = require('../models/BillRequest');
const PaymentInstruction = require('../models/PaymentInstruction');
const logger = require('../config/logger');

exports.submitBillRequest = async (req, res) => {
  try {
    const { userId, accountNumber, amount } = req.body;
    const billRequest = new BillRequest({ userId, accountNumber, amount });
    await billRequest.save();

    res.status(201).json({ success: true, message: 'Bill request submitted', billRequest });
  } catch (err) {
    logger.error('Submit bill request error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit bill request' });
  }
};

exports.getUserBillRequests = async (req, res) => {
  try {
    const billRequests = await BillRequest.find({ userId: req.user.id });
    res.json({ success: true, billRequests });
  } catch (err) {
    logger.error('Fetch user bill requests error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch bill requests' });
  }
};

exports.sendPaymentInstructions = async (req, res) => {
  try {
    const { billRequestId, instructions } = req.body;
    const paymentInstruction = new PaymentInstruction({ billRequestId, instructions });
    await paymentInstruction.save();

    res.status(201).json({ success: true, message: 'Payment instructions sent', paymentInstruction });
  } catch (err) {
    logger.error('Send payment instructions error:', err);
    res.status(500).json({ success: false, message: 'Failed to send payment instructions' });
  }
};

exports.getAllBillRequests = async (req, res) => {
  try {
    const allRequests = await BillRequest.find();
    res.json({ success: true, allRequests });
  } catch (err) {
    logger.error('Fetch all bill requests error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch bill requests' });
  }
};


exports.getBillStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const billRequest = await BillRequest.findOne({ requestId });
    if (!billRequest) {
      return res.status(404).json({ success: false, message: 'Bill request not found' });
    }
    res.json({ success: true, status: billRequest.status });
  } catch (err) {
    logger.error('Get bill status error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

