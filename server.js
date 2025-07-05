const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for demo (replace with database in production)
let billRequests = [];
let paymentInstructions = [];

// Email configuration
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Validation middleware
const validateBillRequest = [
    body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('billType').isIn(['electric', 'water', 'internet']).withMessage('Invalid bill type'),
    body('billAmount').isFloat({ min: 0.01, max: 50000 }).withMessage('Bill amount must be between 0.01 and 50,000'),
    body('provider').trim().isLength({ min: 2, max: 100 }).withMessage('Provider name is required'),
    body('accountNumber').trim().isLength({ min: 1, max: 50 }).withMessage('Account number is required'),
    body('dueDate').isISO8601().withMessage('Valid due date is required'),
    body('paymentMethod').isIn(['bank', 'crypto', 'mobile', 'other']).withMessage('Invalid payment method')
];

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Submit bill payment request
app.post('/api/submit-bill', validateBillRequest, async (req, res) => {
    try {
        // Check validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            fullName,
            email,
            billType,
            billAmount,
            provider,
            accountNumber,
            dueDate,
            paymentMethod
        } = req.body;

        // Generate unique request ID
        const requestId = crypto.randomBytes(16).toString('hex');
        const serviceFee = 150.00;
        const totalAmount = parseFloat(billAmount) + serviceFee;

        // Create bill request object
        const billRequest = {
            id: requestId,
            fullName,
            email,
            billType,
            billAmount: parseFloat(billAmount),
            provider,
            accountNumber,
            dueDate,
            paymentMethod,
            serviceFee,
            totalAmount,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Store the request (in production, save to database)
        billRequests.push(billRequest);

        // Generate payment instructions
        const instructions = generatePaymentInstructions(paymentMethod, totalAmount, requestId);
        
        // Store payment instructions
        paymentInstructions.push({
            requestId,
            instructions,
            createdAt: new Date().toISOString()
        });

        // Send email with payment instructions
        await sendPaymentInstructions(email, fullName, billRequest, instructions);

        res.json({
            success: true,
            message: 'Bill payment request submitted successfully',
            requestId,
            totalAmount,
            instructions
        });

    } catch (error) {
        console.error('Error processing bill request:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
});

// Get payment status
app.get('/api/status/:requestId', (req, res) => {
    const { requestId } = req.params;
    const request = billRequests.find(r => r.id === requestId);
    
    if (!request) {
        return res.status(404).json({
            success: false,
            message: 'Request not found'
        });
    }

    res.json({
        success: true,
        status: request.status,
        request: {
            id: request.id,
            billType: request.billType,
            provider: request.provider,
            totalAmount: request.totalAmount,
            status: request.status,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
        }
    });
});

// Admin routes (in production, add proper authentication)
app.get('/api/admin/requests', (req, res) => {
    // In production, add admin authentication here
    res.json({
        success: true,
        requests: billRequests.map(req => ({
            ...req,
            accountNumber: req.accountNumber.replace(/./g, '*') // Mask sensitive data
        }))
    });
});

// Update request status (admin only)
app.put('/api/admin/requests/:requestId/status', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, receiptUrl } = req.body;
        
        const requestIndex = billRequests.findIndex(r => r.id === requestId);
        if (requestIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        billRequests[requestIndex].status = status;
        billRequests[requestIndex].updatedAt = new Date().toISOString();
        
        if (receiptUrl) {
            billRequests[requestIndex].receiptUrl = receiptUrl;
        }

        // Send notification email
        if (status === 'completed') {
            await sendCompletionNotification(
                billRequests[requestIndex].email,
                billRequests[requestIndex].fullName,
                billRequests[requestIndex],
                receiptUrl
            );
        }

        res.json({
            success: true,
            message: 'Status updated successfully',
            request: billRequests[requestIndex]
        });

    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Helper functions
function generatePaymentInstructions(paymentMethod, totalAmount, requestId) {
    const instructions = {
        requestId,
        totalAmount,
        currency: '₺',
        method: paymentMethod
    };

    switch (paymentMethod) {
        case 'bank':
            instructions.details = {
                bankName: 'Turkish Bank',
                accountName: 'PayEase Services',
                accountNumber: 'TR33 0006 1005 1978 6457 8413 26',
                iban: 'TR33 0006 1005 1978 6457 8413 26',
                reference: `PAYEASE-${requestId}`,
                instructions: [
                    'Transfer the exact amount to the account above',
                    'Use the reference number in the description',
                    'Send us the transfer receipt via email'
                ]
            };
            break;

        case 'crypto':
            instructions.details = {
                currency: 'USDT (TRC20)',
                address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
                reference: `PAYEASE-${requestId}`,
                instructions: [
                    'Send equivalent amount in USDT to the address above',
                    'Include the reference in the memo/note',
                    'Send us the transaction hash'
                ]
            };
            break;

        case 'mobile':
            instructions.details = {
                provider: 'Turkcell/Vodafone/Türk Telekom',
                number: '+90 533 841 30 66',
                reference: `PAYEASE-${requestId}`,
                instructions: [
                    'Send money to the number above',
                    'Include the reference in the message',
                    'Send us the confirmation SMS'
                ]
            };
            break;

        case 'other':
            instructions.details = {
                contact: 'navinjulius@gmail.com',
                phone: '+90 533 841 30 66',
                reference: `PAYEASE-${requestId}`,
                instructions: [
                    'Contact us for alternative payment arrangements',
                    'Mention your reference number',
                    'We accept various payment methods'
                ]
            };
            break;
    }

    return instructions;
}

async function sendPaymentInstructions(email, name, request, instructions) {
    const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #667eea;">PayEase - Payment Instructions</h2>
        <p>Dear ${name},</p>
        <p>Thank you for choosing PayEase! Your bill payment request has been received.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Request Details:</h3>
            <p><strong>Request ID:</strong> ${request.id}</p>
            <p><strong>Bill Type:</strong> ${request.billType.toUpperCase()}</p>
            <p><strong>Provider:</strong> ${request.provider}</p>
            <p><strong>Bill Amount:</strong> ₺${request.billAmount.toFixed(2)}</p>
            <p><strong>Service Fee:</strong> ₺${request.serviceFee.toFixed(2)}</p>
            <p><strong>Total Amount:</strong> ₺${request.totalAmount.toFixed(2)}</p>
        </div>

        <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Payment Instructions:</h3>
            ${generatePaymentInstructionsHTML(instructions)}
        </div>

        <p><strong>Next Steps:</strong></p>
        <ol>
            <li>Complete the payment using the instructions above</li>
            <li>Send us the payment confirmation</li>
            <li>We'll process your bill within 24 hours</li>
            <li>You'll receive the receipt via email</li>
        </ol>

        <p>If you have any questions, please contact us at navinjulius@gmail.com or +90 533 841 30 66</p>
        
        <p>Best regards,<br>PayEase Team</p>
    </div>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `PayEase - Payment Instructions for Request ${request.id}`,
        html: emailHtml
    });
}

function generatePaymentInstructionsHTML(instructions) {
    const details = instructions.details;
    let html = `<p><strong>Payment Method:</strong> ${instructions.method.toUpperCase()}</p>`;
    html += `<p><strong>Amount:</strong> ${instructions.currency}${instructions.totalAmount.toFixed(2)}</p>`;
    
    Object.keys(details).forEach(key => {
        if (key !== 'instructions') {
            html += `<p><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${details[key]}</p>`;
        }
    });

    if (details.instructions) {
        html += '<p><strong>Instructions:</strong></p><ul>';
        details.instructions.forEach(instruction => {
            html += `<li>${instruction}</li>`;
        });
        html += '</ul>';
    }

    return html;
}

async function sendCompletionNotification(email, name, request, receiptUrl) {
    const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4caf50;">PayEase - Bill Payment Completed! ✅</h2>
        <p>Dear ${name},</p>
        <p>Great news! Your bill has been successfully paid.</p>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Payment Summary:</h3>
            <p><strong>Request ID:</strong> ${request.id}</p>
            <p><strong>Bill Type:</strong> ${request.billType.toUpperCase()}</p>
            <p><strong>Provider:</strong> ${request.provider}</p>
            <p><strong>Amount Paid:</strong> ₺${request.billAmount.toFixed(2)}</p>
            <p><strong>Service Fee:</strong> ₺${request.serviceFee.toFixed(2)}</p>
            <p><strong>Total Charged:</strong> ₺${request.totalAmount.toFixed(2)}</p>
            <p><strong>Status:</strong> <span style="color: #4caf50; font-weight: bold;">COMPLETED</span></p>
        </div>

        ${receiptUrl ? `<p><strong>Receipt:</strong> <a href="${receiptUrl}" style="color: #667eea;">Download Receipt</a></p>` : ''}
        
        <p>Thank you for using PayEase! We hope to serve you again soon.</p>
        
        <p>Best regards,<br>PayEase Team</p>
    </div>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `PayEase - Bill Payment Completed for Request ${request.id}`,
        html: emailHtml
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

app.listen(PORT, () => {
    console.log(`PayEase server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});