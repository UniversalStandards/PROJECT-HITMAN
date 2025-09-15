import logging
from typing import Any, Dict, Optional
import os
from functools import wraps
import asyncio

from modern_treasury.main import create_modern_treasury_account_async
from stripe.main import create_stripe_customer_async

# Set logger to display messages based on the LOG_LEVEL environment variable
logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)


# Define a simple exponential backoff function
def backoff(start_sleep_time=0.1, factor=2, max_sleep_time=3):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            sleep_time = start_sleep_time
            while True:
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    logger.error(f"Failed operation, retrying in {sleep_time}s: {e}")
                    await asyncio.sleep(sleep_time)
                    sleep_time = min(sleep_time * factor, max_sleep_time)

        return wrapper

    return decorator


# Process responses for consistency and to centralize error handling
async def process_response(response: Dict[str, Any], service: str) -> Optional[str]:
    if response.get("success"):
        return response.get(service)
    else:
        logger.error(
            f"Error processing {service} response: {response.get('error', 'Unknown error')}"
        )
        return None


# Asynchronous account creation for Modern Treasury with validation and exponential backoff
@backoff()
async def create_modern_account(api_key: str, params: Dict[str, Any]) -> Optional[str]:
    response = await create_modern_treasury_account_async(api_key, params)
    return await process_response(response, "account_id")


# Asynchronous customer creation for Stripe with validation and exponential backoff
@backoff()
async def create_stripe_account(api_key: str, params: Dict[str, Any]) -> Optional[str]:
    customer = await create_stripe_customer_async(api_key, params)
    return await process_response(customer, "id")


# Controller function to route to the correct asynchronous account creation function
async def create_accounts(
    service: str, api_key: str, params: Dict[str, Any]
) -> Optional[str]:
    service_creation_map = {
        "modern_treasury": create_modern_account,
        "stripe": create_stripe_account,
    }

    if service not in service_creation_map or (
        service == "modern_treasury" and not api_key
    ):
        logger.error("Invalid service or missing API key for Modern Treasury.")
        return None

    creation_func = service_creation_map[service]
    return await creation_func(api_key, params)


# Update if additional features or enhancements are needed
# ...
