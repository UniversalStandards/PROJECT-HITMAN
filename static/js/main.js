// GOFAP Main JavaScript File
// GOFAP Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')); tooltipTriggerList.forEach(function (tooltipTriggerEl) { new bootstrap.Tooltip(tooltipTriggerEl); });
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
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
    popoverTriggerList.forEach(function (popoverTriggerEl) { return new bootstrap.Popover(popoverTriggerEl); });
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Add loading state to buttons on form submission
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
                submitBtn.disabled = true;
                
                // Re-enable button after 5 seconds as fallback
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 5000);
            }
        });
    });

    // Auto-dismiss alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            const alertInstance = new bootstrap.Alert(alert);
            alertInstance.close();
        }, 5000);
    });

    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Format currency inputs
    const currencyInputs = document.querySelectorAll('input[data-type="currency"]');
    currencyInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^\d.]/g, '');
            if (value) {
                value = parseFloat(value).toFixed(2);
                e.target.value = '$' + value;
            }
        });
    });

    // Add confirmation to delete buttons
    const deleteButtons = document.querySelectorAll('.btn-delete, .btn-danger[data-action="delete"]');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const itemName = this.dataset.itemName || 'this item';
            if (confirm(`Are you sure you want to delete ${itemName}? This action cannot be undone.`)) {
                // Proceed with deletion
                if (this.href) {
                    window.location.href = escape(this.href);
                } else if (this.onclick) {
                    this.onclick();
                }
            }
        });
    });
});

// Utility functions
const GOFAP = {
    // Show notification
    showNotification: function(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            const alert = bootstrap.Alert.getOrCreateInstance(alertDiv);
            alert.close();
        }, 5000);
    },

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
    formatDate: function(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    },

    // API helper
    api: {
        call: async function(url, options = {}) {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            
            const config = Object.assign(defaultOptions, options);
            
            try {
                const response = await fetch(url, config);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'An error occurred');
                }
                
                return data;
            } catch (error) {
                GOFAP.showNotification(error.message, 'danger');
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
        div.innerHTML = html;
        return div.innerHTML;
    }
};

// Export for testing if module system is available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GOFAP;
}
    // Copy to clipboard
    copyToClipboard: function(text) {
        navigator.clipboard.writeText(text).then(() => {
            GOFAP.showNotification('Copied to clipboard!', 'success');
        }).catch(() => {
            GOFAP.showNotification('Failed to copy to clipboard', 'danger');
        });
    }
};

// Make GOFAP globally available
window.GOFAP = GOFAP;
