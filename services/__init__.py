
from .stripe.stripe import StripeService
from .paypal.paypal import PaypalService
from .modern_treasury.modern_treasury import ModernTreasuryService

def get_service(service_name: str):
    """Factory function to get service instances."""
    services = {
        'stripe': StripeService,
        'paypal': PaypalService,
        'modern_treasury': ModernTreasuryService
    }
    
    if service_name not in services:
        raise ValueError(f"Unknown service: {service_name}")
    
    return services[service_name]()

__all__ = ['StripeService', 'PaypalService', 'ModernTreasuryService', 'get_service']
