// File: /models/User.js
// Standard users
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date }

});

// Check if model already exists before compiling
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);