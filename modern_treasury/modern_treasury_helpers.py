import requests
import asyncio
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

# Modern Treasury API base URL
MT_BASE_URL = "https://app.moderntreasury.com/api"


def create_modern_treasury_account(
    api_key: str, account_params: Dict[str, Any]
) -> requests.Response:
    """Create a Modern Treasury account."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    url = f"{MT_BASE_URL}/external_accounts"
    response = requests.post(url, json=account_params, headers=headers)
    return response


def get_modern_treasury_account(
    api_key: str, account_id: str
) -> requests.Response:
    """Get a Modern Treasury account by ID."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    url = f"{MT_BASE_URL}/external_accounts/{account_id}"
    response = requests.get(url, headers=headers)
    return response


def update_modern_treasury_account(
    api_key: str, account_id: str, update_params: Dict[str, Any]
) -> requests.Response:
    """Update a Modern Treasury account."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    url = f"{MT_BASE_URL}/external_accounts/{account_id}"
    response = requests.patch(url, json=update_params, headers=headers)
    return response


def delete_modern_treasury_account(
    api_key: str, account_id: str
) -> requests.Response:
    """Delete a Modern Treasury account."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    url = f"{MT_BASE_URL}/external_accounts/{account_id}"
    response = requests.delete(url, headers=headers)
    return response


async def create_modern_treasury_account_async(
    api_key: str, params: Dict[str, Any]
) -> Dict[str, Any]:
    """Async version of Modern Treasury account creation."""
    try:
        # Simulate async operation - in real implementation, use aiohttp
        response = create_modern_treasury_account(api_key, params)
        if response.status_code in [200, 201]:
            return {
                "success": True,
                "account_id": response.json().get("id", ""),
            }
        else:
            return {
                "success": False,
                "error": f"HTTP {response.status_code}: {response.text}",
            }
    except Exception as e:
        logger.error(f"Error creating Modern Treasury account: {e}")
        return {"success": False, "error": str(e)}
