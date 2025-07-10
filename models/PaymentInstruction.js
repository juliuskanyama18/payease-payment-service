// File: /models/PaymentInstruction.js
//Holds instructions linked to a requestId
const mongoose = require('mongoose');

const PaymentInstructionSchema = new mongoose.Schema({
    requestId: { type: String, required: true },
    instructions: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PaymentInstruction', PaymentInstructionSchema);
