from .paypal import PaypalIssuer

def get_paypal_issuer(*args, **kwargs):
    """
    Factory function to create and return a new PaypalIssuer instance.
    Pass any required arguments to PaypalIssuer via this function.
    """
    return PaypalIssuer(*args, **kwargs)