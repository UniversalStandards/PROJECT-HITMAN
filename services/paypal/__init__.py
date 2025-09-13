from .paypal import PaypalService

def get_paypal_service():
    """
    Factory function to create and return a new PaypalService instance.
    """
    return PaypalService()