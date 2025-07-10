// File: /config/db.js
//Handles MongoDB connection logic
const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('Connected to MongoDB');
    } catch (err) {
        logger.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;