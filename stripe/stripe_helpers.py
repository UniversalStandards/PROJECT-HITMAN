import stripe
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)



def create_stripe_customer(params):
    """Create a Stripe customer."""
    return stripe.Customer.create(**params)


async def create_stripe_customer_async(
    api_key: str, params: Dict[str, Any]
) -> Dict[str, Any]:
    """Async version of Stripe customer creation."""
    try:
        stripe.api_key = api_key
        customer = create_stripe_customer(params)
        return {"success": True, "id": customer.id}
    except Exception as e:
        logger.error(f"Error creating Stripe customer: {e}")
        return {"success": False, "error": str(e)}
    return stripe.Customer.create(**params)
