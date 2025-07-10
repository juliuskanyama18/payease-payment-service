// middleware/auth.js
// This file contains the authentication middleware for both user and admin routes.
// It checks for JWT tokens in the request headers or session, verifies them, and attaches the user or admin object to the request object for further processing.
// It also handles errors related to authentication failures.
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const AdminUser = require('../models/AdminUser');

const userAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.session.userToken;
    if (!token) return res.status(401).json({ success: false, message: 'No token provided.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid token.' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.session.adminToken;
    if (!token) return res.status(401).json({ success: false, message: 'No token provided.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const admin = await AdminUser.findById(decoded.id);
    if (!admin || !admin.isActive) return res.status(401).json({ success: false, message: 'Invalid token.' });

    req.admin = admin;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};

module.exports = { userAuth, adminAuth };