// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const AdminUser = require('../models/AdminUser');
const logger = require('../config/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token or user not active' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Token verification error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    // Check session token first
    let token = req.session.adminToken;
    
    // If no session token, check Authorization header
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Admin access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get admin from database
    const admin = await AdminUser.findById(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin token or admin not active' 
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    logger.error('Admin token verification error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired admin token' 
    });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  adminAuth,
  requireRole
};