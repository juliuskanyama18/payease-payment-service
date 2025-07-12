// controllers/userController.js
const BillRequest = require('../models/BillRequest');
const User = require('../models/user');
const logger = require('../config/logger');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user profile' 
    });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { fullName, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update basic info
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current password is required to set new password' 
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        });
      }

      const saltRounds = 10;
      user.password = await bcrypt.hash(newPassword, saltRounds);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
};

// Get user's bills
exports.getUserBills = async (req, res) => {
  try {
    const bills = await BillRequest.find({ 
      email: req.user.email 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      bills: bills.map(bill => ({
        id: bill._id,
        requestId: bill.requestId,
        billType: bill.billType,
        billAmount: bill.billAmount,
        provider: bill.provider,
        accountNumber: bill.accountNumber,
        dueDate: bill.dueDate,
        paymentMethod: bill.paymentMethod,
        serviceFee: bill.serviceFee,
        totalAmount: bill.totalAmount,
        status: bill.status,
        receiptUrl: bill.receiptUrl,
        notes: bill.notes,
        createdAt: bill.createdAt,
        updatedAt: bill.updatedAt
      }))
    });
  } catch (error) {
    logger.error('Get user bills error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bills' 
    });
  }
};

// Create new bill
exports.createUserBill = async (req, res) => {
  try {
    const {
      billType,
      billAmount,
      provider,
      accountNumber,
      dueDate,
      paymentMethod,
      serviceFee,
      totalAmount
    } = req.body;

    // Generate unique request ID
    const requestId = uuidv4();

    const billRequest = new BillRequest({
      requestId,
      fullName: req.user.fullName,
      email: req.user.email,
      billType,
      billAmount,
      provider,
      accountNumber,
      dueDate,
      paymentMethod,
      serviceFee,
      totalAmount,
      status: 'pending'
    });

    await billRequest.save();

    res.status(201).json({
      success: true,
      message: 'Bill payment request submitted successfully',
      bill: {
        id: billRequest._id,
        requestId: billRequest.requestId,
        billType: billRequest.billType,
        billAmount: billRequest.billAmount,
        provider: billRequest.provider,
        accountNumber: billRequest.accountNumber,
        dueDate: billRequest.dueDate,
        paymentMethod: billRequest.paymentMethod,
        serviceFee: billRequest.serviceFee,
        totalAmount: billRequest.totalAmount,
        status: billRequest.status,
        createdAt: billRequest.createdAt,
        updatedAt: billRequest.updatedAt
      }
    });
  } catch (error) {
    logger.error('Create user bill error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit bill payment request' 
    });
  }
};

// Get specific bill by ID
exports.getUserBillById = async (req, res) => {
  try {
    const { billId } = req.params;
    const bill = await BillRequest.findOne({ 
      _id: billId,
      email: req.user.email 
    });

    if (!bill) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bill not found' 
      });
    }

    res.json({
      success: true,
      bill: {
        id: bill._id,
        requestId: bill.requestId,
        billType: bill.billType,
        billAmount: bill.billAmount,
        provider: bill.provider,
        accountNumber: bill.accountNumber,
        dueDate: bill.dueDate,
        paymentMethod: bill.paymentMethod,
        serviceFee: bill.serviceFee,
        totalAmount: bill.totalAmount,
        status: bill.status,
        receiptUrl: bill.receiptUrl,
        notes: bill.notes,
        createdAt: bill.createdAt,
        updatedAt: bill.updatedAt
      }
    });
  } catch (error) {
    logger.error('Get user bill by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bill' 
    });
  }
};