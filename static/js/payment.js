
class PaymentProcessor {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Payment form submission
        const paymentForms = document.querySelectorAll('[data-payment-form]');
        paymentForms.forEach(form => {
            form.addEventListener('submit', this.handlePaymentSubmit.bind(this));
        });

        // Service selection
        const serviceRadios = document.querySelectorAll('input[name="service"]');
        serviceRadios.forEach(radio => {
            radio.addEventListener('change', this.handleServiceChange.bind(this));
        });
    }

    async handlePaymentSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const paymentData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/payments/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(`Payment processed successfully! Payment ID: ${result.payment_id}`);
                form.reset();
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            console.error('Payment error:', error);
            this.showError('Payment processing failed. Please try again.');
        }
    }

    async handleServiceChange(event) {
        const service = event.target.value;
        const serviceFields = document.querySelectorAll('.service-fields');
        
        // Hide all service-specific fields
        serviceFields.forEach(field => {
            field.style.display = 'none';
        });

        // Show fields for selected service
        const selectedFields = document.getElementById(`${service}Fields`);
        if (selectedFields) {
            selectedFields.style.display = 'block';
        }

        // Load service-specific data
        await this.loadServiceData(service);
    }

    async loadServiceData(service) {
        try {
            const response = await fetch(`/api/payments/balance/${service}`);
            const result = await response.json();

            if (result.success) {
                this.updateBalanceDisplay(service, result);
            }
        } catch (error) {
            console.error('Service data loading error:', error);
        }
    }

    updateBalanceDisplay(service, balanceData) {
        const balanceElement = document.getElementById(`${service}Balance`);
        if (balanceElement) {
            balanceElement.textContent = JSON.stringify(balanceData, null, 2);
        }
    }

    showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('.container').prepend(alert);
    }

    showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('.container').prepend(alert);
    }
}

// Initialize payment processor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PaymentProcessor();
});
