// const express = require('express');
// const nodemailer = require('nodemailer');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const { body, validationResult } = require('express-validator');
// const crypto = require('crypto');
// const path = require('path');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const session = require('express-session');
// const MongoStore = require('connect-mongo');
// const mongoose = require('mongoose');
// const winston = require('winston');
// const DOMPurify = require('isomorphic-dompurify');
// const https = require('https');
// const fs = require('fs');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Configure logging
// const logger = winston.createLogger({
//     level: process.env.LOG_LEVEL || 'info',
//     format: winston.format.combine(
//         winston.format.timestamp(),
//         winston.format.errors({ stack: true }),
//         winston.format.json()
//     ),
//     defaultMeta: { service: 'payease-server' },
//     transports: [
//         new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
//         new winston.transports.File({ filename: 'logs/combined.log' }),
//         new winston.transports.Console({
//             format: winston.format.simple()
//         })
//     ]
// });

// // MongoDB connection
// console.log('MongoDB URL:', process.env.MONGO_URI);
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => logger.info('Connected to MongoDB'))
//   .catch(err => logger.error('MongoDB connection error:', err));




// // MongoDB Schemas
// const BillRequestSchema = new mongoose.Schema({
//     requestId: { type: String, unique: true, required: true },
//     fullName: { type: String, required: true },
//     email: { type: String, required: true },
//     billType: { type: String, enum: ['electric', 'water', 'internet'], required: true },
//     billAmount: { type: Number, required: true },
//     provider: { type: String, required: true },
//     accountNumber: { type: String, required: true },
//     dueDate: { type: Date, required: true },
//     paymentMethod: { type: String, enum: ['bank', 'crypto', 'mobile', 'other'], required: true },
//     serviceFee: { type: Number, required: true },
//     totalAmount: { type: Number, required: true },
//     status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
//     receiptUrl: { type: String },
//     notes: { type: String },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now }
// });

// const AdminUserSchema = new mongoose.Schema({
//     username: { type: String, unique: true, required: true },
//     email: { type: String, unique: true, required: true },
//     password: { type: String, required: true },
//     role: { type: String, enum: ['admin', 'super_admin'], default: 'admin' },
//     lastLogin: { type: Date },
//     isActive: { type: Boolean, default: true },
//     createdAt: { type: Date, default: Date.now }
// });

// const PaymentInstructionSchema = new mongoose.Schema({
//     requestId: { type: String, required: true },
//     instructions: { type: Object, required: true },
//     createdAt: { type: Date, default: Date.now }
// });

// const UserSchema = new mongoose.Schema({
//     fullName: { type: String, required: true },
//     email: { type: String, unique: true, required: true },
//     password: { type: String, required: true },
//     role: { type: String, default: 'user' },
//     isActive: { type: Boolean, default: true },
//     lastLogin: { type: Date },
//     createdAt: { type: Date, default: Date.now }
// });

// const BillRequest = mongoose.model('BillRequest', BillRequestSchema);
// const AdminUser = mongoose.model('AdminUser', AdminUserSchema);
// const PaymentInstruction = mongoose.model('PaymentInstruction', PaymentInstructionSchema);
// const User = mongoose.model('User', UserSchema);

// // Security middleware
// app.use(helmet({
//     contentSecurityPolicy: {
//         directives: {
//             defaultSrc: ["'self'"],
//             styleSrc: ["'self'", "'unsafe-inline'"],
//             scriptSrc: ["'self'", "'unsafe-inline'"],
//             imgSrc: ["'self'", "data:", "https:"],
//         },
//     },
// }));

// app.use(cors({
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     credentials: true
// }));

// // Session configuration
// app.use(session({
//     secret: process.env.SESSION_SECRET || 'your-session-secret-key',
//     resave: false,
//     saveUninitialized: false,
//     store: MongoStore.create({
//         mongoUrl: process.env.MONGO_URI,
//         touchAfter: 24 * 3600 // lazy session update
//     }),
//     cookie: {
//         secure: process.env.NODE_ENV === 'production',
//         httpOnly: true,
//         maxAge: 1000 * 60 * 60 * 24 // 24 hours
//     }
// }));

// // Rate limiting
// const limiter = rateLimit({
//     windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//     max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
//     message: 'Too many requests from this IP, please try again later.',
//     standardHeaders: true,
//     legacyHeaders: false,
// });

// const strictLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 5, // limit each IP to 5 requests per windowMs for login
//     message: 'Too many login attempts, please try again later.',
//     skipSuccessfulRequests: true,
// });

// app.use(limiter);

// // Body parsing middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Serve static files
// app.use(express.static(path.join(__dirname, 'public')));

// // Email configuration
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// });

// // Input sanitization middleware
// const sanitizeInput = (req, res, next) => {
//     for (let key in req.body) {
//         if (typeof req.body[key] === 'string') {
//             req.body[key] = DOMPurify.sanitize(req.body[key]);
//         }
//     }
//     next();
// };

// // Admin authentication middleware
// const adminAuth = async (req, res, next) => {
//     try {
//         const token = req.headers.authorization?.split(' ')[1] || req.session.adminToken;
        
//         if (!token) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Access denied. No token provided.'
//             });
//         }

//         const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
//         const admin = await AdminUser.findById(decoded.id);
        
//         if (!admin || !admin.isActive) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Access denied. Invalid token.'
//             });
//         }

//         req.admin = admin;
//         next();
//     } catch (error) {
//         logger.error('Admin auth error:', error);
//         res.status(401).json({
//             success: false,
//             message: 'Access denied. Invalid token.'
//         });
//     }
// };


// const userAuth = async (req, res, next) => {
//     try {
//         const token = req.headers.authorization?.split(' ')[1] || req.session.userToken;
        
//         if (!token) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Access denied. No token provided.'
//             });
//         }

//         const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
//         const user = await User.findById(decoded.id);
        
//         if (!user || !user.isActive) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Access denied. Invalid token.'
//             });
//         }

//         req.user = user;
//         next();
//     } catch (error) {
//         logger.error('User auth error:', error);
//         res.status(401).json({
//             success: false,
//             message: 'Access denied. Invalid token.'
//         });
//     }
// };


// // Validation middleware
// const validateBillRequest = [
//     body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
//     body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
//     body('billType').isIn(['electric', 'water', 'internet']).withMessage('Invalid bill type'),
//     body('billAmount').isFloat({ min: 0.01, max: 50000 }).withMessage('Bill amount must be between 0.01 and 50,000'),
//     body('provider').trim().isLength({ min: 2, max: 100 }).withMessage('Provider name is required'),
//     body('accountNumber').trim().isLength({ min: 1, max: 50 }).withMessage('Account number is required'),
//     body('dueDate').isISO8601().withMessage('Valid due date is required'),
//     body('paymentMethod').isIn(['bank', 'crypto', 'mobile', 'other']).withMessage('Invalid payment method')
// ];

// const validateAdminLogin = [
//     body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
//     body('password').isLength({ min: 6, max: 100 }).withMessage('Password must be between 6 and 100 characters')
// ];

// const validateUserLogin = [
//     body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
//     body('password').isLength({ min: 6, max: 100 }).withMessage('Password must be between 6 and 100 characters')
// ];

// // Routes
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // Serve admin panel
// app.get('/admin', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'admin', 'admin.html'));
// });

// // Admin login
// app.post('/api/admin/login', strictLimiter, validateAdminLogin, sanitizeInput, async (req, res) => {
//     try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({
//                 success: false,
//                 errors: errors.array()
//             });
//         }

//         const { username, password } = req.body;
        
//         const admin = await AdminUser.findOne({ username, isActive: true });
//         if (!admin) {
//             logger.warn(`Failed login attempt for username: ${username}`);
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid credentials'
//             });
//         }

//         const isValidPassword = await bcrypt.compare(password, admin.password);
//         if (!isValidPassword) {
//             logger.warn(`Failed login attempt for username: ${username}`);
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid credentials'
//             });
//         }

//         // Update last login
//         admin.lastLogin = new Date();
//         await admin.save();

//         // Generate JWT token
//         const token = jwt.sign(
//             { id: admin._id, username: admin.username, role: admin.role },
//             process.env.JWT_SECRET || 'your-super-secret-jwt-key',
//             { expiresIn: '24h' }
//         );

//         // Store token in session
//         req.session.adminToken = token;

//         logger.info(`Admin login successful: ${username}`);
//         res.json({
//             success: true,
//             message: 'Login successful',
//             token,
//             admin: {
//                 id: admin._id,
//                 username: admin.username,
//                 email: admin.email,
//                 role: admin.role,
//                 lastLogin: admin.lastLogin
//             }
//         });

//     } catch (error) {
//         logger.error('Admin login error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error'
//         });
//     }
// });


// // User login endpoint
// app.post('/api/auth/login', strictLimiter, validateUserLogin, sanitizeInput, async (req, res) => {
//     try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({
//                 success: false,
//                 errors: errors.array()
//             });
//         }

//         const { email, password } = req.body;
        
//         const user = await User.findOne({ email, isActive: true });
//         if (!user) {
//             logger.warn(`Failed login attempt for email: ${email}`);
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid credentials'
//             });
//         }

//         const isValidPassword = await bcrypt.compare(password, user.password);
//         if (!isValidPassword) {
//             logger.warn(`Failed login attempt for email: ${email}`);
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid credentials'
//             });
//         }

//         // Update last login
//         user.lastLogin = new Date();
//         await user.save();

//         // Generate JWT token
//         const token = jwt.sign(
//             { id: user._id, email: user.email, role: user.role },
//             process.env.JWT_SECRET || 'your-super-secret-jwt-key',
//             { expiresIn: '24h' }
//         );

//         // Store token in session
//         req.session.userToken = token;

//         logger.info(`User login successful: ${email}`);
//         res.json({
//             success: true,
//             message: 'Login successful',
//             token,
//             user: {
//                 id: user._id,
//                 fullName: user.fullName,
//                 email: user.email,
//                 role: user.role,
//                 lastLogin: user.lastLogin
//             }
//         });

//     } catch (error) {
//         logger.error('User login error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error'
//         });
//     }
// });

// // User logout endpoint
// app.post('/api/auth/logout', (req, res) => {
//     req.session.destroy((err) => {
//         if (err) {
//             logger.error('Logout error:', err);
//             return res.status(500).json({
//                 success: false,
//                 message: 'Logout failed'
//             });
//         }
//         res.json({
//             success: true,
//             message: 'Logout successful'
//         });
//     });
// });

// // User registration endpoint (for future use)
// app.post('/api/auth/register', validateUserLogin, sanitizeInput, async (req, res) => {
//     try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({
//                 success: false,
//                 errors: errors.array()
//             });
//         }

//         const { fullName, email, password } = req.body;
        
//         // Check if user already exists
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'User already exists with this email'
//             });
//         }

//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

//         // Create new user
//         const user = new User({
//             fullName,
//             email,
//             password: hashedPassword
//         });

//         await user.save();

//         logger.info(`User registered successfully: ${email}`);
//         res.json({
//             success: true,
//             message: 'User registered successfully',
//             user: {
//                 id: user._id,
//                 fullName: user.fullName,
//                 email: user.email,
//                 role: user.role
//             }
//         });

//     } catch (error) {
//         logger.error('User registration error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error'
//         });
//     }
// });

// // Admin logout
// app.post('/api/admin/logout', (req, res) => {
//     req.session.destroy((err) => {
//         if (err) {
//             logger.error('Logout error:', err);
//             return res.status(500).json({
//                 success: false,
//                 message: 'Logout failed'
//             });
//         }
//         res.json({
//             success: true,
//             message: 'Logout successful'
//         });
//     });
// });

// // Protect admin routes
// app.use('/api/admin', adminAuth);

// // Submit bill payment request
// app.post('/api/submit-bill', validateBillRequest, sanitizeInput, async (req, res) => {
//     try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({
//                 success: false,
//                 errors: errors.array()
//             });
//         }

//         const {
//             fullName,
//             email,
//             billType,
//             billAmount,
//             provider,
//             accountNumber,
//             dueDate,
//             paymentMethod
//         } = req.body;

//         // Generate unique request ID
//         const requestId = crypto.randomBytes(16).toString('hex');
//         const serviceFee = 150.00;
//         const totalAmount = parseFloat(billAmount) + serviceFee;

//         // Create bill request
//         const billRequest = new BillRequest({
//             requestId,
//             fullName,
//             email,
//             billType,
//             billAmount: parseFloat(billAmount),
//             provider,
//             accountNumber,
//             dueDate,
//             paymentMethod,
//             serviceFee,
//             totalAmount
//         });

//         await billRequest.save();

//         // Generate payment instructions
//         const instructions = generatePaymentInstructions(paymentMethod, totalAmount, requestId);
        
//         // Store payment instructions
//         const paymentInstruction = new PaymentInstruction({
//             requestId,
//             instructions
//         });
//         await paymentInstruction.save();

//         // Send email with payment instructions
//         await sendPaymentInstructions(email, fullName, billRequest, instructions);

//         logger.info(`Bill request submitted: ${requestId} for ${email}`);
//         res.json({
//             success: true,
//             message: 'Bill payment request submitted successfully',
//             requestId,
//             totalAmount,
//             instructions
//         });

//     } catch (error) {
//         logger.error('Error processing bill request:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error. Please try again later.'
//         });
//     }
// });

// // Get payment status
// app.get('/api/status/:requestId', async (req, res) => {
//     try {
//         const { requestId } = req.params;
//         const request = await BillRequest.findOne({ requestId });
        
//         if (!request) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Request not found'
//             });
//         }

//         res.json({
//             success: true,
//             status: request.status,
//             request: {
//                 id: request.requestId,
//                 billType: request.billType,
//                 provider: request.provider,
//                 totalAmount: request.totalAmount,
//                 status: request.status,
//                 createdAt: request.createdAt,
//                 updatedAt: request.updatedAt
//             }
//         });
//     } catch (error) {
//         logger.error('Error fetching status:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error'
//         });
//     }
// });

// // Admin: Get all requests
// app.get('/api/admin/requests', async (req, res) => {
//     try {
//         const requests = await BillRequest.find({})
//             .sort({ createdAt: -1 })
//             .limit(1000); // Limit to prevent memory issues

//         const maskedRequests = requests.map(req => ({
//             ...req.toObject(),
//             id: req.requestId, // Frontend expects 'id' field
//             accountNumber: req.accountNumber.replace(/./g, '*') // Mask sensitive data
//         }));

//         res.json({
//             success: true,
//             requests: maskedRequests
//         });
//     } catch (error) {
//         logger.error('Error fetching admin requests:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error'
//         });
//     }
// });

// // Admin: Update request status
// app.put('/api/admin/requests/:requestId/status', async (req, res) => {
//     try {
//         const { requestId } = req.params;
//         const { status, receiptUrl, notes } = req.body;
        
//         const request = await BillRequest.findOne({ requestId });
//         if (!request) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Request not found'
//             });
//         }

//         // Update request
//         request.status = status;
//         request.updatedAt = new Date();
        
//         if (receiptUrl) {
//             request.receiptUrl = receiptUrl;
//         }
        
//         if (notes) {
//             request.notes = notes;
//         }

//         await request.save();

//         // Send notification email
//         if (status === 'completed') {
//             await sendCompletionNotification(
//                 request.email,
//                 request.fullName,
//                 request,
//                 receiptUrl
//             );
//         }

//         logger.info(`Request ${requestId} status updated to ${status} by admin ${req.admin.username}`);
//         res.json({
//             success: true,
//             message: 'Status updated successfully',
//             request: request.toObject()
//         });

//     } catch (error) {
//         logger.error('Error updating status:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error'
//         });
//     }
// });

// // Admin: Get dashboard stats
// app.get('/api/admin/stats', async (req, res) => {
//     try {
//         const stats = await BillRequest.aggregate([
//             {
//                 $group: {
//                     _id: '$status',
//                     count: { $sum: 1 }
//                 }
//             }
//         ]);

//         const totalRequests = await BillRequest.countDocuments();
//         const totalRevenue = await BillRequest.aggregate([
//             { $match: { status: 'completed' } },
//             { $group: { _id: null, total: { $sum: '$serviceFee' } } }
//         ]);

//         const formattedStats = {
//             total: totalRequests,
//             pending: stats.find(s => s._id === 'pending')?.count || 0,
//             processing: stats.find(s => s._id === 'processing')?.count || 0,
//             completed: stats.find(s => s._id === 'completed')?.count || 0,
//             failed: stats.find(s => s._id === 'failed')?.count || 0,
//             revenue: totalRevenue[0]?.total || 0
//         };

//         res.json({
//             success: true,
//             stats: formattedStats
//         });
//     } catch (error) {
//         logger.error('Error fetching stats:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error'
//         });
//     }
// });

// // Helper functions (same as before, but with enhanced logging)
// function generatePaymentInstructions(paymentMethod, totalAmount, requestId) {
//     const instructions = {
//         requestId,
//         totalAmount,
//         currency: '₺',
//         method: paymentMethod
//     };

//     switch (paymentMethod) {
//         case 'bank':
//             instructions.details = {
//                 bankName: 'Turkish Bank',
//                 accountName: 'PayEase Services',
//                 accountNumber: 'TR33 0006 1005 1978 6457 8413 26',
//                 iban: 'TR33 0006 1005 1978 6457 8413 26',
//                 reference: `PAYEASE-${requestId}`,
//                 instructions: [
//                     'Transfer the exact amount to the account above',
//                     'Use the reference number in the description',
//                     'Send us the transfer receipt via email'
//                 ]
//             };
//             break;

//         case 'crypto':
//             instructions.details = {
//                 currency: 'USDT (TRC20)',
//                 address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
//                 reference: `PAYEASE-${requestId}`,
//                 instructions: [
//                     'Send equivalent amount in USDT to the address above',
//                     'Include the reference in the memo/note',
//                     'Send us the transaction hash'
//                 ]
//             };
//             break;

//         case 'mobile':
//             instructions.details = {
//                 provider: 'Turkcell/Vodafone/Türk Telekom',
//                 number: '+90 533 841 30 66',
//                 reference: `PAYEASE-${requestId}`,
//                 instructions: [
//                     'Send money to the number above',
//                     'Include the reference in the message',
//                     'Send us the confirmation SMS'
//                 ]
//             };
//             break;

//         case 'other':
//             instructions.details = {
//                 contact: 'navinjulius@gmail.com',
//                 phone: '+90 533 841 30 66',
//                 reference: `PAYEASE-${requestId}`,
//                 instructions: [
//                     'Contact us for alternative payment arrangements',
//                     'Mention your reference number',
//                     'We accept various payment methods'
//                 ]
//             };
//             break;
//     }

//     return instructions;
// }

// async function sendPaymentInstructions(email, name, request, instructions) {
//     try {
//         const emailHtml = `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//             <h2 style="color: #667eea;">PayEase - Payment Instructions</h2>
//             <p>Dear ${name},</p>
//             <p>Thank you for choosing PayEase! Your bill payment request has been received.</p>
            
//             <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
//                 <h3>Request Details:</h3>
//                 <p><strong>Request ID:</strong> ${request.requestId}</p>
//                 <p><strong>Bill Type:</strong> ${request.billType.toUpperCase()}</p>
//                 <p><strong>Provider:</strong> ${request.provider}</p>
//                 <p><strong>Bill Amount:</strong> ₺${request.billAmount.toFixed(2)}</p>
//                 <p><strong>Service Fee:</strong> ₺${request.serviceFee.toFixed(2)}</p>
//                 <p><strong>Total Amount:</strong> ₺${request.totalAmount.toFixed(2)}</p>
//             </div>

//             <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
//                 <h3>Payment Instructions:</h3>
//                 ${generatePaymentInstructionsHTML(instructions)}
//             </div>

//             <p><strong>Next Steps:</strong></p>
//             <ol>
//                 <li>Complete the payment using the instructions above</li>
//                 <li>Send us the payment confirmation</li>
//                 <li>We'll process your bill within 24 hours</li>
//                 <li>You'll receive the receipt via email</li>
//             </ol>

//             <p>If you have any questions, please contact us at navinjulius@gmail.com or +90 533 841 30 66</p>
            
//             <p>Best regards,<br>PayEase Team</p>
//         </div>
//         `;

//         await transporter.sendMail({
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: `PayEase - Payment Instructions for Request ${request.requestId}`,
//             html: emailHtml
//         });

//         logger.info(`Payment instructions sent to ${email} for request ${request.requestId}`);
//     } catch (error) {
//         logger.error('Error sending payment instructions:', error);
//         throw error;
//     }
// }

// function generatePaymentInstructionsHTML(instructions) {
//     const details = instructions.details;
//     let html = `<p><strong>Payment Method:</strong> ${instructions.method.toUpperCase()}</p>`;
//     html += `<p><strong>Amount:</strong> ${instructions.currency}${instructions.totalAmount.toFixed(2)}</p>`;
    
//     Object.keys(details).forEach(key => {
//         if (key !== 'instructions') {
//             html += `<p><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${details[key]}</p>`;
//         }
//     });

//     if (details.instructions) {
//         html += '<p><strong>Instructions:</strong></p><ul>';
//         details.instructions.forEach(instruction => {
//             html += `<li>${instruction}</li>`;
//         });
//         html += '</ul>';
//     }

//     return html;
// }

// async function sendCompletionNotification(email, name, request, receiptUrl) {
//     try {
//         const emailHtml = `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//             <h2 style="color: #4caf50;">PayEase - Bill Payment Completed! ✅</h2>
//             <p>Dear ${name},</p>
//             <p>Great news! Your bill has been successfully paid.</p>
            
//             <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
//                 <h3>Payment Summary:</h3>
//                 <p><strong>Request ID:</strong> ${request.requestId}</p>
//                 <p><strong>Bill Type:</strong> ${request.billType.toUpperCase()}</p>
//                 <p><strong>Provider:</strong> ${request.provider}</p>
//                 <p><strong>Amount Paid:</strong> ₺${request.billAmount.toFixed(2)}</p>
//                 <p><strong>Service Fee:</strong> ₺${request.serviceFee.toFixed(2)}</p>
//                 <p><strong>Total Charged:</strong> ₺${request.totalAmount.toFixed(2)}</p>
//                 <p><strong>Status:</strong> <span style="color: #4caf50; font-weight: bold;">COMPLETED</span></p>
//             </div>

//             ${receiptUrl ? `<p><strong>Receipt:</strong> <a href="${receiptUrl}" style="color: #667eea;">Download Receipt</a></p>` : ''}
            
//             <p>Thank you for using PayEase! We hope to serve you again soon.</p>
            
//             <p>Best regards,<br>PayEase Team</p>
//         </div>
//         `;

//         await transporter.sendMail({
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: `PayEase - Bill Payment Completed for Request ${request.requestId}`,
//             html: emailHtml
//         });

//         logger.info(`Completion notification sent to ${email} for request ${request.requestId}`);
//     } catch (error) {
//         logger.error('Error sending completion notification:', error);
//         throw error;
//     }
// }

// // Create default admin user if none exists
// async function createDefaultAdmin() {
//     try {
//         const adminCount = await AdminUser.countDocuments();
//         if (adminCount === 0) {
//             const hashedPassword = await bcrypt.hash('admin123', parseInt(process.env.BCRYPT_ROUNDS) || 12);
//             const defaultAdmin = new AdminUser({
//                 username: 'admin',
//                 email: 'admin@payease.com',
//                 password: hashedPassword,
//                 role: 'super_admin'
//             });
//             await defaultAdmin.save();
//             logger.info('Default admin user created: admin/admin123');
//         }
//     } catch (error) {
//         logger.error('Error creating default admin:', error);
//     }
// }



// async function createDefaultUser() {
//     try {
//         const userCount = await User.countDocuments();
//         if (userCount === 0) {
//             const hashedPassword = await bcrypt.hash('user123', parseInt(process.env.BCRYPT_ROUNDS) || 12);
//             const defaultUser = new User({
//                 fullName: 'Test User',
//                 email: 'user@payease.com',
//                 password: hashedPassword,
//                 role: 'user'
//             });
//             await defaultUser.save();
//             logger.info('Default user created: user@payease.com/user123');
//         }
//     } catch (error) {
//         logger.error('Error creating default user:', error);
//     }
// }

// // Error handling middleware
// app.use((err, req, res, next) => {
//     logger.error('Unhandled error:', err);
//     res.status(500).json({
//         success: false,
//         message: 'Internal server error'
//     });
// });

// // 404 handler
// app.use((req, res) => {
//     res.status(404).json({
//         success: false,
//         message: 'Endpoint not found'
//     });
// });

// // Start server
// async function startServer() {
//     try {
//         await createDefaultAdmin();
//         await createDefaultUser(); // Add this line
        
//         if (process.env.NODE_ENV === 'production' && process.env.SSL_CERT_PATH && process.env.SSL_KEY_PATH) {
//             // HTTPS server for production
//             const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
//             const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
//             const credentials = { key: privateKey, cert: certificate };
            
//             const httpsServer = https.createServer(credentials, app);
//             httpsServer.listen(PORT, () => {
//                 logger.info(`PayEase HTTPS server running on port ${PORT}`);
//                 logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
//             });
//         } else {
//             // HTTP server for development
//             app.listen(PORT, () => {
//                 logger.info(`PayEase server running on port ${PORT}`);
//                 logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
//             });
//         }
//     } catch (error) {
//         logger.error('Failed to start server:', error);
//         process.exit(1);
//     }
// }

// startServer();













// const express = require('express');
// const app = express();
// const config = require('./config/db');
// const auth = require('./middleware/auth');
// const sanitize = require('./middleware/sanitize');
// const setupRoutes = require('./routes/adminRoutes');
// const { startServer } = require('./utils/serverStarter');

// config(app);
// auth(app);
// sanitize(app);


// setupRoutes(app);
// startServer(app);





// server.js 
const express = require('express'); 
const session = require('express-session'); 
const cors = require('cors'); 
const helmet = require('helmet'); 
require('dotenv').config();  

const connectDB = require('./config/db'); 
const logger = require('./config/logger');  

const app = express(); 
const PORT = process.env.PORT;  

// Middleware 
app.use(helmet()); 
app.use(cors()); 
app.use(express.json());  

app.use(session({   
  secret: process.env.SESSION_SECRET || 'keyboard cat',   
  resave: false,   
  saveUninitialized: false,   
  cookie: { secure: false } // true if using HTTPS 
}));  

// Sanitize middleware 
app.use(require('./middleware/sanitize'));  

// Serve static frontend files 
app.use(express.static('public'));  

// Routes
app.use('/api/admin', require('./routes/adminRoutes')); 
app.use('/api/auth', require('./routes/authRoutes')); 
app.use('/api/bills', require('./routes/billRoutes'));  

// Connect DB and start server 
connectDB()   
  .then(() => {     
    app.listen(PORT, () => {       
      logger.info(`✅ Server running on port ${PORT}`);     
    });   
  })   
  .catch(err => {     
    logger.error('❌ Failed to connect to MongoDB', err);     
    process.exit(1);   
  });
