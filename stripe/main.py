import stripe
from stripe_helpers import create_stripe_customer

# Set your Stripe API key
stripe.api_key = "stripe_api_key"

# Define parameters for customer creation
customer_params = {
    "name": "Customer Name",
    "email": "customer@email.com",
    "phone": "Customer Phone",
    "address": {
        "line1": "Customer Address Line 1",
        "line2": "Customer Address Line 2",
        "city": "Customer City",
        "state": "Customer State",
        "postal_code": "Customer Postal Code",
        "country": "Customer Country",
    },
}

# Create a Stripe customer
customer = create_stripe_customer(customer_params)

# Print the customer ID or other relevant info
print(customer.id)
