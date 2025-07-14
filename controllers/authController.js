// controllers/authController.js
//contains all your user login, register, and logout logic, cleanly separated from server.js.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const AdminUser = require('../models/AdminUser');
const logger = require('../config/logger');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');

exports.loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // First check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'No user found with this email address' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'User account is deactivated' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    req.session.userToken = token;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        lastLogin: user.lastLogin
      }
    });
    
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { fullName, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ fullName, email, password: hashedPassword });
    await newUser.save();

    res.json({ success: true, message: 'User registered', user: { id: newUser._id, email: newUser.email } });
  } catch (err) {
    logger.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      logger.error('Logout error:', err);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
};



// Step 1: Send Reset Link
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ success: false, message: 'No account found with that email' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = Date.now() + 3600000; // 1 hour

  user.resetToken = token;
  user.resetTokenExpiry = tokenExpiry;
  await user.save();

  const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'PayEase Password Reset',
    html: `<p>Click the link below to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`
  });

  res.json({ success: true, message: 'Password reset link sent to your email.' });
};

// Step 2: Handle Password Reset Submission
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
  }

  user.password = await bcrypt.hash(password, 12);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  res.json({ success: true, message: 'Password has been reset successfully.' });
};