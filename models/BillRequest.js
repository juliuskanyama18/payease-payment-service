// File: /models/BillRequest.js
//Bill data with type, provider, amount, status, etc.
const mongoose = require('mongoose');

const BillRequestSchema = new mongoose.Schema({
    requestId: { type: String, unique: true, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    billType: { type: String, enum: ['electric', 'water', 'internet'], required: true },
    billAmount: { type: Number, required: true },
    provider: { type: String, required: true },
    accountNumber: { type: String, required: true },
    dueDate: { type: Date, required: true },
    paymentMethod: { type: String, enum: ['bank', 'crypto', 'mobile', 'other'], required: true },
    serviceFee: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    receiptUrl: { type: String },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BillRequest', BillRequestSchema);