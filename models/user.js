// File: /models/User.js
//Standard users
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);