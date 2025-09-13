import stripe


def create_stripe_customer(params):
    return stripe.Customer.create(**params)
