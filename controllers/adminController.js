// controllers/adminController.js
//contains all logic related to admin login, logout, request management, and system statistics, fully extracted from your original server.js.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const AdminUser = require('../models/AdminUser');
const BillRequest = require('../models/BillRequest');
const logger = require('../config/logger');
const { sendCompletionNotification } = require('../utils/email');

exports.loginAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, password } = req.body;
    const admin = await AdminUser.findOne({ username, isActive: true });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    req.session.adminToken = token;

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });
  } catch (err) {
    logger.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.logoutAdmin = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      logger.error('Admin logout error:', err);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await BillRequest.find({}).sort({ createdAt: -1 }).limit(1000);
    const masked = requests.map(r => ({
      ...r.toObject(),
      id: r.requestId,
      accountNumber: r.accountNumber.replace(/./g, '*')
    }));
    res.json({ success: true, requests: masked });
  } catch (err) {
    logger.error('Fetch requests error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, receiptUrl, notes } = req.body;

    const request = await BillRequest.findOne({ requestId });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = status;
    request.updatedAt = new Date();
    if (receiptUrl) request.receiptUrl = receiptUrl;
    if (notes) request.notes = notes;

    await request.save();

    if (status === 'completed') {
      await sendCompletionNotification(request.email, request.fullName, request, receiptUrl);
    }

    res.json({ success: true, message: 'Status updated', request });
  } catch (err) {
    logger.error('Update status error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await BillRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const total = await BillRequest.countDocuments();
    const revenueAgg = await BillRequest.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$serviceFee' } } }
    ]);

    const revenue = revenueAgg[0]?.total || 0;
    const summary = {
      total,
      pending: stats.find(s => s._id === 'pending')?.count || 0,
      processing: stats.find(s => s._id === 'processing')?.count || 0,
      completed: stats.find(s => s._id === 'completed')?.count || 0,
      failed: stats.find(s => s._id === 'failed')?.count || 0,
      revenue
    };

    res.json({ success: true, stats: summary });
  } catch (err) {
    logger.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};