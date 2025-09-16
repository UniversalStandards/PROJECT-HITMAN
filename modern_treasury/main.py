import requests
from modern_treasury_helpers import (
    create_modern_treasury_account,
    get_modern_treasury_account,
    update_modern_treasury_account,
    delete_modern_treasury_account,
)

# Define API key for Modern Treasury
modern_treasury_api_key = "your_modern_treasury_api_key"

# Define parameters for account creation
account_params = {
    "name": "John Doe",
    "type": "checking",
    "description": "Personal checking account",
    "routing_number": "123456789",
    "account_number": "987654321",
    "currency": "USD",
    "tags": ["personal", "checking"],
    "metadata": {"customer_id": "12345", "branch": "Main Branch"},
}

try:
    # Create the Modern Treasury account
    response = create_modern_treasury_account(modern_treasury_api_key, account_params)
    account_id = response.json()["id"]
    print(f"Account created successfully. Account ID: {account_id}")
    print("Response:", response.json())

    # Get the created account details
    account_response = get_modern_treasury_account(
        modern_treasury_api_key, account_id
    )
    print("\nAccount Details:")
    print(account_response.json())

    # Update the account details
    update_params = {
        "description": "Updated personal checking account",
        "tags": ["personal", "checking", "updated"],
    }
    update_response = update_modern_treasury_account(
        modern_treasury_api_key, account_id, update_params
    )
    print("\nAccount updated successfully.")
    print("Response:", update_response.json())

    # Delete the account
    delete_response = delete_modern_treasury_account(
        modern_treasury_api_key, account_id
    )
    print("\nAccount deleted successfully.")
    print("Response:", delete_response.json())

except requests.exceptions.RequestException as e:
    print("An error occurred while making the API request:")
    print(e)

except KeyError as e:
    print("An error occurred while accessing the response data:")
    print(e)
