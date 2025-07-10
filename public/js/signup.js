        const API_BASE_URL = window.location.origin;

        document.addEventListener('DOMContentLoaded', function() {
            const signupForm = document.getElementById('signupForm');
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            
            signupForm.addEventListener('submit', handleSignup);
            passwordInput.addEventListener('input', validatePassword);
            confirmPasswordInput.addEventListener('input', validatePasswordMatch);
        });

        async function handleSignup(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const fullName = formData.get('fullName').trim();
            const email = formData.get('email').trim();
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            
            // Client-side validation
            if (!validateForm(fullName, email, password, confirmPassword)) {
                return;
            }
            
            showLoading(true);
            clearAlert();
            
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fullName,
                        email,
                        password
                    })
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    showAlert('Account created successfully! Redirecting to login...', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    throw new Error(result.message || 'Registration failed');
                }
                
            } catch (error) {
                console.error('Signup error:', error);
                showAlert(error.message || 'Registration failed. Please try again.', 'error');
            } finally {
                showLoading(false);
            }
        }

        function validateForm(fullName, email, password, confirmPassword) {
            if (!fullName || fullName.length < 2) {
                showAlert('Please enter a valid full name (at least 2 characters)', 'error');
                return false;
            }
            
            if (!isValidEmail(email)) {
                showAlert('Please enter a valid email address', 'error');
                return false;
            }
            
            if (!isValidPassword(password)) {
                showAlert('Password does not meet requirements', 'error');
                return false;
            }
            
            if (password !== confirmPassword) {
                showAlert('Passwords do not match', 'error');
                return false;
            }
            
            return true;
        }

        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        function isValidPassword(password) {
            return password.length >= 6 &&
                   /[A-Z]/.test(password) &&
                   /[a-z]/.test(password) &&
                   /\d/.test(password);
        }

        function validatePassword() {
            const password = document.getElementById('password').value;
            const requirements = {
                minLength: password.length >= 6,
                hasUppercase: /[A-Z]/.test(password),
                hasLowercase: /[a-z]/.test(password),
                hasNumber: /\d/.test(password)
            };
            
            Object.keys(requirements).forEach(req => {
                const element = document.getElementById(req);
                if (requirements[req]) {
                    element.classList.add('valid');
                    element.classList.remove('invalid');
                } else {
                    element.classList.add('invalid');
                    element.classList.remove('valid');
                }
            });
        }

        function validatePasswordMatch() {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const confirmInput = document.getElementById('confirmPassword');
            
            if (confirmPassword && password !== confirmPassword) {
                confirmInput.style.borderColor = '#e74c3c';
            } else {
                confirmInput.style.borderColor = '#e1e5e9';
            }
        }

        function showLoading(show) {
            const signupBtn = document.getElementById('signupBtn');
            const loadingIndicator = document.getElementById('loadingIndicator');
            const signupForm = document.getElementById('signupForm');
            
            if (show) {
                signupBtn.disabled = true;
                signupForm.style.display = 'none';
                loadingIndicator.style.display = 'block';
            } else {
                signupBtn.disabled = false;
                signupForm.style.display = 'block';
                loadingIndicator.style.display = 'none';
            }
        }

        function showAlert(message, type) {
            const alertContainer = document.getElementById('signupAlert');
            const alertClass = type === 'error' ? 'alert-error' : 'alert-success';
            alertContainer.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
        }

        function clearAlert() {
            document.getElementById('signupAlert').innerHTML = '';
        }