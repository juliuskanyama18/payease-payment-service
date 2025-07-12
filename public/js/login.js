// public/js/login.js
const API_BASE_URL = window.location.origin;

// Handle user type selection
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    // checkExistingLogin();
    
    // Handle form submission
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
});

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Show loading state
    showLoading(true);
    clearAlert();
    
    try {
        // First try admin login
        const adminResponse = await tryAdminLogin(email, password);
        
        if (adminResponse.success) {
            // Store admin token and data
            localStorage.setItem('payease_token', adminResponse.token);
            localStorage.setItem('payease_user', JSON.stringify({
                ...adminResponse.admin,
                role: 'admin'
            }));
            
            showAlert('Admin login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = '/admin/admin.html';
            }, 1500);
            return;
        }
        
        // If admin login fails, try regular user login
        const userResponse = await tryUserLogin(email, password);
        
        if (userResponse.success) {
            // Store user token and data
            localStorage.setItem('payease_token', userResponse.token);
            localStorage.setItem('payease_user', JSON.stringify({
                ...userResponse.user,
                role: 'user'
            }));
            
            showAlert('Login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = '/UserDashboard.html';
            }, 1500);
            return;
        }
        
        // If both fail, show error
        throw new Error('Invalid email or password');
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message || 'Login failed. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

async function tryAdminLogin(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: email, // Admin login uses username field
                password: password
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            return {
                success: true,
                token: result.token,
                admin: result.admin
            };
        }
        
        return { success: false };
        
    } catch (error) {
        console.error('Admin login error:', error);
        return { success: false };
    }
}

async function tryUserLogin(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            return {
                success: true,
                token: result.token,
                user: result.user
            };
        }
        
        return { success: false };
        
    } catch (error) {
        console.error('User login error:', error);
        return { success: false };
    }
}

// function checkExistingLogin() {
//     const token = localStorage.getItem('payease_token');
//     const userStr = localStorage.getItem('payease_user');
    
//     if (token && userStr) {
//         try {
//             const user = JSON.parse(userStr);
            
//             // Redirect based on user role
//             if (user.role === 'admin') {
//                 window.location.href = '/admin.html';
//             } else {
//                 window.location.href = '/index.html';
//             }
//         } catch (error) {
//             // Clear invalid stored data
//             localStorage.removeItem('payease_token');
//             localStorage.removeItem('payease_user');
//         }
//     }
// }

function showLoading(show) {
    const loginBtn = document.getElementById('loginBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const loginForm = document.getElementById('loginForm');
    
    if (show) {
        loginBtn.disabled = true;
        loginForm.style.display = 'none';
        loadingIndicator.style.display = 'block';
    } else {
        loginBtn.disabled = false;
        loginForm.style.display = 'block';
        loadingIndicator.style.display = 'none';
    }
}

function showAlert(message, type) {
    const alertContainer = document.getElementById('loginAlert');
    const alertClass = type === 'error' ? 'alert-error' : 'alert-success';
    alertContainer.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
}

function clearAlert() {
    document.getElementById('loginAlert').innerHTML = '';
}

function showForgotPassword() {
    showAlert('Password reset feature will be available soon. Please contact support.', 'error');
}

