//public/admin/admin.js
const API_BASE_URL = window.location.origin;
        let allRequests = [];
        let filteredRequests = [];

        // Load requests on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadRequests();

            const adminlogoutbtn = document.getElementById('logout-btn');
            if (adminlogoutbtn) {
                adminlogoutbtn.addEventListener('click', logout);
            }
            // Auto-refresh every 30 seconds
            setInterval(loadRequests, 30000);
        });

        // Load all requests from API
        async function loadRequests() {
            try {
                const refreshIcon = document.getElementById('refreshIcon');
                refreshIcon.style.animation = 'spin 1s linear infinite';
                
                const response = await fetch(`${API_BASE_URL}/api/admin/requests`);
                const result = await response.json();
                
                if (response.ok) {
                    allRequests = result.requests;
                    filteredRequests = [...allRequests];
                    updateDashboardStats();
                    renderRequestsTable();
                } else {
                    throw new Error(result.message || 'Failed to load requests');
                }
            } catch (error) {
                console.error('Error loading requests:', error);
                document.getElementById('requestsTableBody').innerHTML = `
                    <tr>
                        <td colspan="8" class="no-data">Failed to load requests: ${error.message}</td>
                    </tr>
                `;
            } finally {
                document.getElementById('refreshIcon').style.animation = '';
            }
        }

        // Update dashboard statistics
        function updateDashboardStats() {
            const stats = {
                total: allRequests.length,
                pending: allRequests.filter(r => r.status === 'pending').length,
                processing: allRequests.filter(r => r.status === 'processing').length,
                completed: allRequests.filter(r => r.status === 'completed').length
            };

            document.getElementById('totalRequests').textContent = stats.total;
            document.getElementById('pendingRequests').textContent = stats.pending;
            document.getElementById('processingRequests').textContent = stats.processing;
            document.getElementById('completedRequests').textContent = stats.completed;
        }

        // Render requests table
        function renderRequestsTable() {
            const tbody = document.getElementById('requestsTableBody');
            
            if (filteredRequests.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="no-data">No requests found</td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = filteredRequests.map(request => `
                <tr>
                    <td><code>${request.id.substr(0, 8)}...</code></td>
                    <td>${request.fullName}</td>
                    <td>${request.billType.toUpperCase()}</td>
                    <td>${request.provider}</td>
                    <td>₺${request.totalAmount.toFixed(2)}</td>
                    <td><span class="status-badge status-${request.status}">${request.status}</span></td>
                    <td>${new Date(request.createdAt).toLocaleDateString()}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="viewRequestDetails('${request.id}')">View</button>
                            <button class="btn btn-success" onclick="openUpdateStatusModal('${request.id}')">Update</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        // Filter requests based on selected criteria
        function filterRequests() {
            const statusFilter = document.getElementById('statusFilter').value;
            const billTypeFilter = document.getElementById('billTypeFilter').value;

            filteredRequests = allRequests.filter(request => {
                const matchesStatus = !statusFilter || request.status === statusFilter;
                const matchesBillType = !billTypeFilter || request.billType === billTypeFilter;
                return matchesStatus && matchesBillType;
            });

            renderRequestsTable();
        }

        // View request details
        function viewRequestDetails(requestId) {
            const request = allRequests.find(r => r.id === requestId);
            if (!request) return;

            const detailsHtml = `
                <div class="detail-grid">
                    <div class="detail-label">Request ID:</div>
                    <div class="detail-value"><code>${request.id}</code></div>
                    
                    <div class="detail-label">Customer Name:</div>
                    <div class="detail-value">${request.fullName}</div>
                    
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">${request.email}</div>
                    
                    <div class="detail-label">Bill Type:</div>
                    <div class="detail-value">${request.billType.toUpperCase()}</div>
                    
                    <div class="detail-label">Provider:</div>
                    <div class="detail-value">${request.provider}</div>
                    
                    <div class="detail-label">Account Number:</div>
                    <div class="detail-value">${request.accountNumber}</div>
                    
                    <div class="detail-label">Bill Amount:</div>
                    <div class="detail-value">₺${request.billAmount.toFixed(2)}</div>
                    
                    <div class="detail-label">Service Fee:</div>
                    <div class="detail-value">₺${request.serviceFee.toFixed(2)}</div>
                    
                    <div class="detail-label">Total Amount:</div>
                    <div class="detail-value"><strong>₺${request.totalAmount.toFixed(2)}</strong></div>
                    
                    <div class="detail-label">Payment Method:</div>
                    <div class="detail-value">${request.paymentMethod.toUpperCase()}</div>
                    
                    <div class="detail-label">Due Date:</div>
                    <div class="detail-value">${new Date(request.dueDate).toLocaleDateString()}</div>
                    
                    <div class="detail-label">Status:</div>
                    <div class="detail-value">
                        <span class="status-badge status-${request.status}">${request.status}</span>
                    </div>
                    
                    <div class="detail-label">Created:</div>
                    <div class="detail-value">${new Date(request.createdAt).toLocaleString()}</div>
                    
                    <div class="detail-label">Updated:</div>
                    <div class="detail-value">${new Date(request.updatedAt).toLocaleString()}</div>
                    
                    ${request.receiptUrl ? `
                        <div class="detail-label">Receipt:</div>
                        <div class="detail-value"><a href="${request.receiptUrl}" target="_blank">View Receipt</a></div>
                    ` : ''}
                </div>
            `;

            document.getElementById('requestDetailsBody').innerHTML = detailsHtml;
            document.getElementById('viewDetailsModal').style.display = 'flex';
        }

        // Open update status modal
        function openUpdateStatusModal(requestId) {
            const request = allRequests.find(r => r.id === requestId);
            if (!request) return;

            document.getElementById('requestId').value = requestId;
            document.getElementById('newStatus').value = request.status;
            document.getElementById('receiptUrl').value = request.receiptUrl || '';
            document.getElementById('notes').value = '';
            document.getElementById('statusUpdateAlert').innerHTML = '';

            document.getElementById('updateStatusModal').style.display = 'flex';
        }

        // Update request status
        async function updateRequestStatus() {
            try {
                const form = document.getElementById('updateStatusForm');
                const formData = new FormData(form);
                const requestId = formData.get('requestId');
                const newStatus = formData.get('newStatus');
                const receiptUrl = formData.get('receiptUrl');
                const notes = formData.get('notes');

                if (!newStatus) {
                    showAlert('statusUpdateAlert', 'Please select a status', 'error');
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/admin/requests/${requestId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        status: newStatus,
                        receiptUrl: receiptUrl || null,
                        notes: notes || null
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    showAlert('statusUpdateAlert', 'Status updated successfully!', 'success');
                    await loadRequests(); // Refresh the data
                    setTimeout(() => {
                        closeModal('updateStatusModal');
                    }, 1500);
                } else {
                    throw new Error(result.message || 'Failed to update status');
                }
            } catch (error) {
                console.error('Error updating status:', error);
                showAlert('statusUpdateAlert', `Error: ${error.message}`, 'error');
            }
        }

        // Show alert message
        function showAlert(containerId, message, type) {
            const container = document.getElementById(containerId);
            const alertClass = type === 'error' ? 'alert-error' : 'alert-success';
            container.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
        }

        // Close modal
        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        // Logout function
        async function logout() {
            try {
                const response = await fetch(`${API_BASE_URL}/api/admin/logout`, {
                    method: 'POST',
                    credentials: 'include' // important to send session cookie
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Clear client-side storage (optional)
                    localStorage.removeItem('payease_token');
                    localStorage.removeItem('payease_user');

                    // Redirect to login or homepage
                    window.location.href = '/login.html';
                } else {
                    alert('Logout failed: ' + (result.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Logout error:', error);
                alert('An error occurred while logging out.');
            }
        }


        // Close modal when clicking outside
        window.onclick = function(event) {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }