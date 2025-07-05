// Configuration
const API_BASE_URL = window.location.origin;

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Real-time total calculation
const billAmountInput = document.getElementById('billAmount');
const billAmountDisplay = document.getElementById('billAmountDisplay');
const serviceFeeDisplay = document.getElementById('serviceFeeDisplay');
const totalAmountDisplay = document.getElementById('totalAmountDisplay');

billAmountInput.addEventListener('input', function() {
    const billAmount = parseFloat(this.value) || 0;
    const serviceFee = 150.00; // Fixed service fee in local currency
    const totalAmount = billAmount + serviceFee;
    
    billAmountDisplay.textContent = billAmount.toFixed(2);
    totalAmountDisplay.textContent = totalAmount.toFixed(2);
});

// Form submission handler with API integration
document.getElementById('billPaymentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.querySelector('.submit-btn');
    const originalBtnText = submitBtn.textContent;
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        
        // Get form data
        const formData = new FormData(this);
        const requestData = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            billType: formData.get('billType'),
            billAmount: parseFloat(formData.get('billAmount')),
            provider: formData.get('provider'),
            accountNumber: formData.get('accountNumber'),
            dueDate: formData.get('dueDate'),
            paymentMethod: formData.get('paymentMethod')
        };

        // Validate required fields
        if (!requestData.fullName || !requestData.email || !requestData.billType || 
            !requestData.billAmount || !requestData.provider || !requestData.accountNumber || 
            !requestData.dueDate || !requestData.paymentMethod) {
            throw new Error('Please fill in all required fields');
        }

        // Submit to backend
        const response = await fetch(`${API_BASE_URL}/api/submit-bill`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to submit bill payment request');
        }

        // Show success message with payment instructions
        showSuccessModal(result);
        
        // Reset form
        this.reset();
        billAmountDisplay.textContent = '0.00';
        totalAmountDisplay.textContent = '150.00';

    } catch (error) {
        console.error('Error submitting bill payment:', error);
        showErrorModal(error.message || 'An error occurred while processing your request. Please try again.');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
});

// Success modal function
function showSuccessModal(result) {
    const modal = createModal('success');
    const paymentMethodText = getPaymentMethodText(result.instructions.method);
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>✅ Request Submitted Successfully!</h2>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="success-summary">
                    <h3>📋 Request Summary</h3>
                    <p><strong>Request ID:</strong> ${result.requestId}</p>
                    <p><strong>Total Amount:</strong> ₺${result.totalAmount.toFixed(2)}</p>
                    <p><strong>Payment Method:</strong> ${paymentMethodText}</p>
                </div>
                
                <div class="payment-instructions">
                    <h3>💳 Payment Instructions</h3>
                    ${generatePaymentInstructionsHTML(result.instructions)}
                </div>
                
                <div class="next-steps">
                    <h3>🚀 Next Steps</h3>
                    <ol>
                        <li>Check your email for detailed payment instructions</li>
                        <li>Complete the payment using the method above</li>
                        <li>Send us the payment confirmation</li>
                        <li>We'll process your bill within 24 hours</li>
                        <li>You'll receive the official receipt via email</li>
                    </ol>
                </div>
                
                <div class="track-status">
                    <p><strong>Track your payment:</strong> <a href="#" onclick="trackPayment('${result.requestId}')">Check Status</a></p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" onclick="closeModal()">Got it!</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// Error modal function
function showErrorModal(message) {
    const modal = createModal('error');
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>❌ Error</h2>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p>${message}</p>
                <p>Please try again or contact us at navinjulius@gmail.com if the problem persists.</p>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" onclick="closeModal()">OK</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// Create modal element
function createModal(type) {
    const modal = document.createElement('div');
    modal.className = `modal ${type}-modal`;
    modal.id = 'paymentModal';
    
    // Add modal styles if not already present
    if (!document.getElementById('modalStyles')) {
        const styles = document.createElement('style');
        styles.id = 'modalStyles';
        styles.textContent = `
            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
                align-items: center;
                justify-content: center;
            }
            .modal-content {
                background: white;
                border-radius: 15px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            .modal-header {
                padding: 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .modal-header h2 {
                margin: 0;
                color: #333;
            }
            .close-modal {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }
            .modal-body {
                padding: 20px;
            }
            .modal-footer {
                padding: 20px;
                border-top: 1px solid #eee;
                text-align: right;
            }
            .success-summary, .payment-instructions, .next-steps, .track-status {
                margin-bottom: 20px;
                padding: 15px;
                border-radius: 8px;
            }
            .success-summary {
                background: #e8f5e8;
                border-left: 4px solid #4caf50;
            }
            .payment-instructions {
                background: #e3f2fd;
                border-left: 4px solid #2196f3;
            }
            .next-steps {
                background: #fff3e0;
                border-left: 4px solid #ff9800;
            }
            .track-status {
                background: #f3e5f5;
                border-left: 4px solid #9c27b0;
            }
            .btn-primary {
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            }
            .btn-primary:hover {
                transform: translateY(-2px);
            }
            .payment-details {
                background: #f8f9fa;
                padding: 10px;
                border-radius: 5px;
                margin: 10px 0;
            }
        `;
        document.head.appendChild(styles);
    }
    
    return modal;
}

// Close modal function
function closeModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.remove();
    }
}

// Payment tracking function
async function trackPayment(requestId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/status/${requestId}`);
        const result = await response.json();
        
        if (response.ok) {
            showTrackingModal(result.request);
        } else {
            throw new Error(result.message || 'Failed to fetch status');
        }
    } catch (error) {
        console.error('Error tracking payment:', error);
        alert('Unable to track payment status. Please try again later.');
    }
}

// Show tracking modal
function showTrackingModal(request) {
    const modal = createModal('tracking');
    const statusColor = getStatusColor(request.status);
    const statusText = getStatusText(request.status);
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>📊 Payment Status</h2>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="status-info">
                    <h3>Request Details</h3>
                    <p><strong>Request ID:</strong> ${request.id}</p>
                    <p><strong>Bill Type:</strong> ${request.billType.toUpperCase()}</p>
                    <p><strong>Provider:</strong> ${request.provider}</p>
                    <p><strong>Total Amount:</strong> ₺${request.totalAmount.toFixed(2)}</p>
                    <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
                    <p><strong>Created:</strong> ${new Date(request.createdAt).toLocaleString()}</p>
                    <p><strong>Last Updated:</strong> ${new Date(request.updatedAt).toLocaleString()}</p>
                </div>
                
                <div class="status-timeline">
                    <h3>Progress Timeline</h3>
                    <div class="timeline">
                        <div class="timeline-item ${request.status === 'pending' ? 'active' : 'completed'}">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h4>Request Submitted</h4>
                                <p>Your bill payment request has been received</p>
                            </div>
                        </div>
                        <div class="timeline-item ${request.status === 'processing' ? 'active' : request.status === 'completed' ? 'completed' : ''}">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h4>Payment Processing</h4>
                                <p>We're processing your payment and paying your bill</p>
                            </div>
                        </div>
                        <div class="timeline-item ${request.status === 'completed' ? 'completed' : ''}">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h4>Completed</h4>
                                <p>Bill paid successfully and receipt sent</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" onclick="closeModal()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // Add timeline styles
    addTimelineStyles();
}

// Helper functions
function getPaymentMethodText(method) {
    const methods = {
        'bank': '🏦 Bank Transfer',
        'crypto': '₿ Cryptocurrency',
        'mobile': '📱 Mobile Money',
        'other': '💳 Other Method'
    };
    return methods[method] || method;
}

function getStatusColor(status) {
    const colors = {
        'pending': '#ff9800',
        'processing': '#2196f3',
        'completed': '#4caf50',
        'failed': '#f44336'
    };
    return colors[status] || '#666';
}

function getStatusText(status) {
    const texts = {
        'pending': 'PENDING PAYMENT',
        'processing': 'PROCESSING',
        'completed': 'COMPLETED',
        'failed': 'FAILED'
    };
    return texts[status] || status.toUpperCase();
}

function generatePaymentInstructionsHTML(instructions) {
    const details = instructions.details;
    let html = `<div class="payment-details">`;
    html += `<p><strong>Amount:</strong> ${instructions.currency}${instructions.totalAmount.toFixed(2)}</p>`;
    html += `<p><strong>Reference:</strong> ${details.reference}</p>`;
    
    // Method-specific details
    switch (instructions.method) {
        case 'bank':
            html += `<p><strong>Bank:</strong> ${details.bankName}</p>`;
            html += `<p><strong>Account Name:</strong> ${details.accountName}</p>`;
            html += `<p><strong>IBAN:</strong> ${details.iban}</p>`;
            break;
        case 'crypto':
            html += `<p><strong>Currency:</strong> ${details.currency}</p>`;
            html += `<p><strong>Address:</strong> <code>${details.address}</code></p>`;
            break;
        case 'mobile':
            html += `<p><strong>Provider:</strong> ${details.provider}</p>`;
            html += `<p><strong>Number:</strong> ${details.number}</p>`;
            break;
        case 'other':
            html += `<p><strong>Contact:</strong> ${details.contact}</p>`;
            html += `<p><strong>Phone:</strong> ${details.phone}</p>`;
            break;
    }
    
    html += `</div>`;
    
    if (details.instructions) {
        html += '<h4>Instructions:</h4><ul>';
        details.instructions.forEach(instruction => {
            html += `<li>${instruction}</li>`;
        });
        html += '</ul>';
    }
    
    return html;
}

function addTimelineStyles() {
    if (document.getElementById('timelineStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'timelineStyles';
    styles.textContent = `
        .timeline {
            position: relative;
            padding-left: 30px;
        }
        .timeline::before {
            content: '';
            position: absolute;
            left: 15px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #e0e0e0;
        }
        .timeline-item {
            position: relative;
            margin-bottom: 30px;
        }
        .timeline-marker {
            position: absolute;
            left: -23px;
            top: 0;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #e0e0e0;
            border: 3px solid #fff;
            box-shadow: 0 0 0 3px #e0e0e0;
        }
        .timeline-item.active .timeline-marker {
            background: #ff9800;
            box-shadow: 0 0 0 3px #ff9800;
        }
        .timeline-item.completed .timeline-marker {
            background: #4caf50;
            box-shadow: 0 0 0 3px #4caf50;
        }
        .timeline-content h4 {
            margin: 0 0 5px 0;
            font-size: 16px;
        }
        .timeline-content p {
            margin: 0;
            color: #666;
            font-size: 14px;
        }
        .status-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .status-timeline {
            margin-top: 20px;
        }
    `;
    document.head.appendChild(styles);
}

// Add floating animation to feature cards
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card, .service-card, .step').forEach(card => {
    observer.observe(card);
});

// Add keyboard event listeners for modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Add click outside modal to close
document.addEventListener('click', function(e) {
    const modal = document.getElementById('paymentModal');
    if (modal && e.target === modal) {
        closeModal();
    }
});

// Add notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add notification styles if not present
    if (!document.getElementById('notificationStyles')) {
        const styles = document.createElement('style');
        styles.id = 'notificationStyles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 1001;
                animation: slideIn 0.3s ease;
            }
            .notification.success {
                background: #4caf50;
            }
            .notification.error {
                background: #f44336;
            }
            .notification.info {
                background: #2196f3;
            }
            .notification.warning {
                background: #ff9800;
            }
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Set minimum date to today for due date input
    const dueDateInput = document.getElementById('dueDate');
    if (dueDateInput) {
        const today = new Date().toISOString().split('T')[0];
        dueDateInput.min = today;
    }
    
    // Add form validation feedback
    const form = document.getElementById('billPaymentForm');
    const inputs = form.querySelectorAll('input[required], select[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.style.borderColor = '#f44336';
            } else {
                this.style.borderColor = '#4caf50';
            }
        });
        
        input.addEventListener('input', function() {
            if (this.value) {
                this.style.borderColor = '#4caf50';
            }
        });
    });
    
    console.log('PayEase frontend initialized successfully');
});