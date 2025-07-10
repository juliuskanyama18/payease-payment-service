// File: /models/AdminUser.js
// Admins (with roles like admin, super_admin)
const mongoose = require('mongoose');

const AdminUserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'super_admin'], default: 'admin' },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminUser', AdminUserSchema);