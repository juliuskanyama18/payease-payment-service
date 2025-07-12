const API_BASE_URL = window.location.origin;
let userBills = [];
let currentUser = null;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadUserBills();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Auto-refresh every 30 seconds
    setInterval(loadUserBills, 30000);
    
    // Setup form event listeners
    setupFormListeners();
    
});

// Initialize dashboard with user data
function initializeDashboard() {
    // Check if user is logged in
    const token = localStorage.getItem('payease_token');
    const userStr = localStorage.getItem('payease_user');
    
    if (!token || !userStr) {
        // Redirect to login if not authenticated
        window.location.href = '/login.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(userStr);
        
        // Check if user is admin (should go to admin panel)
        if (currentUser.role === 'admin') {
            window.location.href = '/admin.html';
            return;
        }
        
        // Update user name in header
        document.getElementById('userName').textContent = currentUser.fullName || 'User';
        
        // Load user profile data
        loadUserProfile();
        
    } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
    }
}

// Setup form event listeners
function setupFormListeners() {
    // Bill amount change listener for total calculation
    const billAmountInput = document.getElementById('billAmount');
    if (billAmountInput) {
        billAmountInput.addEventListener('input', updateTotalDisplay);
    }
    
    // Modal close listeners
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
    
    // ESC key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal[style*="flex"]');
            openModals.forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
}

// Load user's bills from API
async function loadUserBills() {
    try {
        const token = localStorage.getItem('payease_token');
        const refreshIcon = document.getElementById('refreshIcon');
        
        if (refreshIcon) {
            refreshIcon.style.animation = 'spin 1s linear infinite';
        }
        
        const response = await fetch(`${API_BASE_URL}/api/user/bills`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            userBills = result.bills || [];
            updateDashboardStats();
            renderBillsGrid();
        } else if (response.status === 401) {
            // Token expired, logout user
            logout();
        } else {
            throw new Error('Failed to load bills');
        }
    } catch (error) {
        console.error('Error loading user bills:', error);
        document.getElementById('billsGrid').innerHTML = `
            <div class="no-bills">Failed to load bills. Please try again.</div>
        `;
    } finally {
        const refreshIcon = document.getElementById('refreshIcon');
        if (refreshIcon) {
            refreshIcon.style.animation = '';
        }
    }
}

// Update dashboard statistics
function updateDashboardStats() {
    const stats = {
        total: userBills.length,
        pending: userBills.filter(bill => bill.status === 'pending').length,
        completed: userBills.filter(bill => bill.status === 'completed').length,
        totalSpent: userBills
            .filter(bill => bill.status === 'completed')
            .reduce((sum, bill) => sum + bill.totalAmount, 0)
    };
    
    document.getElementById('totalBills').textContent = stats.total;
    document.getElementById('pendingBills').textContent = stats.pending;
    document.getElementById('completedBills').textContent = stats.completed;
    document.getElementById('totalSpent').textContent = `₺${stats.totalSpent.toFixed(2)}`;
}

// Render bills grid
function renderBillsGrid() {
    const billsGrid = document.getElementById('billsGrid');
    
    if (userBills.length === 0) {
        billsGrid.innerHTML = `
            <div class="no-bills">
                <p>No bills found. Start by submitting your first bill payment request!</p>
            </div>
        `;
        return;
    }
    
    // Sort bills by creation date (newest first)
    const sortedBills = [...userBills].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    billsGrid.innerHTML = sortedBills.map(bill => `
        <div class="bill-card" onclick="viewBillDetails('${bill.id}')">
            <div class="bill-header">
                <div class="bill-type">
                    ${getBillTypeIcon(bill.billType)} ${bill.billType.toUpperCase()}
                </div>
                <span class="status-badge status-${bill.status}">${bill.status}</span>
            </div>
            <div class="bill-info">
                <div>Provider: ${bill.provider}</div>
                <div>Due: ${new Date(bill.dueDate).toLocaleDateString()}</div>
                <div>Submitted: ${new Date(bill.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="bill-amount">
                Total: ₺${bill.totalAmount.toFixed(2)}
            </div>
        </div>
    `).join('');
}

// Get bill type icon
function getBillTypeIcon(billType) {
    switch(billType) {
        case 'electric': return '⚡';
        case 'water': return '💧';
        case 'internet': return '🌐';
        default: return '📄';
    }
}

// View bill details
function viewBillDetails(billId) {
    const bill = userBills.find(b => b.id === billId);
    if (!bill) return;
    
    const detailsHtml = `
        <div class="detail-grid">
            <div class="detail-label">Bill Type:</div>
            <div class="detail-value">${getBillTypeIcon(bill.billType)} ${bill.billType.toUpperCase()}</div>
            
            <div class="detail-label">Provider:</div>
            <div class="detail-value">${bill.provider}</div>
            
            <div class="detail-label">Account Number:</div>
            <div class="detail-value">${bill.accountNumber}</div>
            
            <div class="detail-label">Bill Amount:</div>
            <div class="detail-value">₺${bill.billAmount.toFixed(2)}</div>
            
            <div class="detail-label">Service Fee:</div>
            <div class="detail-value">₺${bill.serviceFee.toFixed(2)}</div>
            
            <div class="detail-label">Total Amount:</div>
            <div class="detail-value"><strong>₺${bill.totalAmount.toFixed(2)}</strong></div>
            
            <div class="detail-label">Payment Method:</div>
            <div class="detail-value">${bill.paymentMethod.toUpperCase()}</div>
            
            <div class="detail-label">Due Date:</div>
            <div class="detail-value">${new Date(bill.dueDate).toLocaleDateString()}</div>
            
            <div class="detail-label">Status:</div>
            <div class="detail-value">
                <span class="status-badge status-${bill.status}">${bill.status}</span>
            </div>
            
            <div class="detail-label">Submitted:</div>
            <div class="detail-value">${new Date(bill.createdAt).toLocaleString()}</div>
            
            <div class="detail-label">Last Updated:</div>
            <div class="detail-value">${new Date(bill.updatedAt).toLocaleString()}</div>
            
            ${bill.receiptUrl ? `
                <div class="detail-label">Receipt:</div>
                <div class="detail-value"><a href="${bill.receiptUrl}" target="_blank">View Receipt</a></div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('billDetailsBody').innerHTML = detailsHtml;
    document.getElementById('billDetailsModal').style.display = 'flex';
}

// Show new bill form
function showNewBillForm() {
    document.getElementById('newBillModal').style.display = 'flex';
    resetBillForm();
}

// Show my bills (scroll to bills section)
function showMyBills() {
    document.querySelector('.recent-bills').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Show profile modal
function showProfile() {
    document.getElementById('profileModal').style.display = 'flex';
    loadUserProfile();
}

// Load user profile data
function loadUserProfile() {
    if (currentUser) {
        document.getElementById('profileName').value = currentUser.fullName || '';
        document.getElementById('profileEmail').value = currentUser.email || '';
    }
}

// Reset bill form
function resetBillForm() {
    document.getElementById('billPaymentForm').reset();
    document.getElementById('billSubmissionAlert').innerHTML = '';
    updateTotalDisplay();
    
    // Set minimum due date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dueDate').min = today;
}

// Update total display
function updateTotalDisplay() {
    const billAmount = parseFloat(document.getElementById('billAmount').value) || 0;
    const serviceFee = 150.00; // Fixed service fee
    const totalAmount = billAmount + serviceFee;
    
    document.getElementById('billAmountDisplay').textContent = billAmount.toFixed(2);
    document.getElementById('serviceFeeDisplay').textContent = serviceFee.toFixed(2);
    document.getElementById('totalAmountDisplay').textContent = totalAmount.toFixed(2);
}

// Submit bill payment
async function submitBillPayment() {
    const form = document.getElementById('billPaymentForm');
    const formData = new FormData(form);
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const billData = {
        billType: formData.get('billType'),
        billAmount: parseFloat(formData.get('billAmount')),
        provider: formData.get('provider'),
        accountNumber: formData.get('accountNumber'),
        dueDate: formData.get('dueDate'),
        paymentMethod: formData.get('paymentMethod'),
        serviceFee: 150.00,
        totalAmount: parseFloat(formData.get('billAmount')) + 150.00
    };
    
    try {
        const token = localStorage.getItem('payease_token');
        const response = await fetch(`${API_BASE_URL}/api/user/bills`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(billData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            document.getElementById('billSubmissionAlert').innerHTML = `
                <div class="alert alert-success">
                    Bill payment request submitted successfully! Reference: ${result.bill.id}
                </div>
            `;
            
            // Reload bills after 2 seconds
            setTimeout(() => {
                loadUserBills();
                closeModal('newBillModal');
            }, 2000);
            
        } else {
            throw new Error(result.message || 'Failed to submit bill payment');
        }
        
    } catch (error) {
        console.error('Error submitting bill payment:', error);
        document.getElementById('billSubmissionAlert').innerHTML = `
            <div class="alert alert-error">
                ${error.message || 'Failed to submit bill payment. Please try again.'}
            </div>
        `;
    }
}

// Update profile
async function updateProfile() {
    const form = document.getElementById('profileForm');
    const formData = new FormData(form);
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const profileData = {
        fullName: formData.get('fullName'),
        email: formData.get('email')
    };
    
    // Add password if provided
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    
    if (newPassword) {
        if (!currentPassword) {
            document.getElementById('profileAlert').innerHTML = `
                <div class="alert alert-error">
                    Current password is required to set a new password.
                </div>
            `;
            return;
        }
        profileData.currentPassword = currentPassword;
        profileData.newPassword = newPassword;
    }
    
    try {
        const token = localStorage.getItem('payease_token');
        const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Update stored user data
            currentUser = { ...currentUser, ...result.user };
            localStorage.setItem('payease_user', JSON.stringify(currentUser));
            
            // Update UI
            document.getElementById('userName').textContent = currentUser.fullName || 'User';
            
            document.getElementById('profileAlert').innerHTML = `
                <div class="alert alert-success">
                    Profile updated successfully!
                </div>
            `;
            
            // Clear password fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            
        } else {
            throw new Error(result.message || 'Failed to update profile');
        }
        
    } catch (error) {
        console.error('Error updating profile:', error);
        document.getElementById('profileAlert').innerHTML = `
            <div class="alert alert-error">
                ${error.message || 'Failed to update profile. Please try again.'}
            </div>
        `;
    }
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    
    // Clear any alerts
    const alerts = document.querySelectorAll(`#${modalId} .alert`);
    alerts.forEach(alert => alert.remove());
}

// Logout function
function logout() {
    localStorage.removeItem('payease_token');
    localStorage.removeItem('payease_user');
    window.location.href = '/login.html';
}


  

// Utility functions
function formatCurrency(amount) {
    return `₺${amount.toFixed(2)}`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatCurrency,
        formatDate,
        formatDateTime,
        getBillTypeIcon
    };
}