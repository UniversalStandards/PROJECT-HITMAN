// GOFAP Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')); tooltipTriggerList.forEach(function (tooltipTriggerEl) { new bootstrap.Tooltip(tooltipTriggerEl); });
        import 'bootstrap'; // Ensure Bootstrap is imported
    });

    // Initialize popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.forEach(function (popoverTriggerEl) { new bootstrap.Popover(popoverTriggerEl); });
        import 'bootstrap'; // Ensure Bootstrap is imported
    });

    // Auto-hide alerts after 5 seconds
    setTimeout(function() {
        var alerts = document.querySelectorAll('.alert');
        alerts.forEach(function(alert) {
            import bootstrap from 'bootstrap';
            bsAlert.close();
        });
    }, 5000);

    // Add loading states to buttons
    const buttons = document.querySelectorAll('button[type="submit"], .btn-primary, .btn-success');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled) {
                this.disabled = true;
                const originalText = this.textContent || this.innerText;
                this.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Loading...';
                
                // Re-enable after 3 seconds (adjust as needed)
                setTimeout(() => {
                    this.disabled = false;
                    this.textContent = originalText;
                }, 3000);
            }
        });
    });
});

// Utility functions
const GOFAP = {
    // Format currency
    formatCurrency: function(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    // Format date
    formatDate: function(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Intl.DateTimeFormat('en-US', {...defaultOptions, ...options}).format(new Date(date));
    },

    // Show loading spinner
    showLoading: function(element) {
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.id = 'loading-spinner';
        element.appendChild(spinner);
    },

    // Hide loading spinner
    hideLoading: function() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.remove();
        }
    },

    // Show notification - Fixed XSS vulnerability by using textContent and DOM manipulation
    showNotification: function(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        
        // Use textContent to safely set the message text
        alertDiv.textContent = message;
        
        // Create close button separately to avoid innerHTML injection
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn-close';
        closeButton.setAttribute('data-bs-dismiss', 'alert');
        alertDiv.appendChild(closeButton);
        
        const container = document.querySelector('.container-fluid');
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);
        }
    },

    // Validate URL to prevent SSRF attacks
    isValidUrl: function(url) {
        try {
            const urlObj = new URL(url);
            // Only allow HTTP and HTTPS protocols
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return false;
            }
            // Block private IP ranges and localhost
            const hostname = urlObj.hostname;
            if (hostname === 'localhost' || 
                hostname === '127.0.0.1' ||
                hostname.startsWith('192.168.') ||
                hostname.startsWith('10.') ||
                hostname.startsWith('172.')) {
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    },

    // API helper with URL validation
    api: {
        get: async function(url) {
            // Validate URL before making request
            if (!GOFAP.isValidUrl(url)) {
                throw new Error('Invalid or unsafe URL');
            }
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error('API GET error:', error);
                GOFAP.showNotification('Failed to fetch data', 'danger');
                throw error;
            }
        },

        post: async function(url, data) {
            // Validate URL before making request
            if (!GOFAP.isValidUrl(url)) {
                throw new Error('Invalid or unsafe URL');
            }
            
            try {
                const allowedUrls = ['https://example.com/api', 'https://another-safe-site.com/api']; if (!allowedUrls.includes(url)) throw new Error('URL not allowed');
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error('API POST error:', error);
                GOFAP.showNotification('Failed to send data', 'danger');
                throw error;
            }
        },

        put: async function(url, data) {
            // Validate URL before making request
            if (!GOFAP.isValidUrl(url)) {
                throw new Error('Invalid or unsafe URL');
            }
            
            try {
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error('API PUT error:', error);
                GOFAP.showNotification('Failed to update data', 'danger');
                throw error;
            }
        },

        delete: async function(url) {
            // Validate URL before making request
            if (!GOFAP.isValidUrl(url)) {
                throw new Error('Invalid or unsafe URL');
            }
            
            try {
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error('API DELETE error:', error);
                GOFAP.showNotification('Failed to delete data', 'danger');
                throw error;
            }
        }
    },

    // Form validation helpers
    validateForm: function(formElement) {
        const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('is-invalid');
                isValid = false;
            } else {
                input.classList.remove('is-invalid');
            }
        });
        
        return isValid;
    },

    // Sanitize HTML content
    sanitizeHtml: function(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
};

// Export for testing if module system is available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GOFAP;
}