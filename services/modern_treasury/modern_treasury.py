
import os
import requests
from typing import Dict, Any, Optional
from ..service import Service

class ModernTreasuryService(Service):
    """Modern Treasury service for cash management."""
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)
        self.organization_id = os.environ.get('MT_ORGANIZATION_ID')
        self.base_url = "https://app.moderntreasury.com/api"
    
    def get_api_key(self) -> str:
        """Get Modern Treasury API key."""
        api_key = os.environ.get('MODERN_TREASURY_API_KEY')
        if not api_key:
            raise ValueError("MODERN_TREASURY_API_KEY environment variable is required")
        return api_key
    
    def get_headers(self) -> Dict[str, str]:
        """Get API headers."""
        return {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
    
    def create_customer(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a counterparty in Modern Treasury."""
        try:
            payload = {
                'name': customer_data.get('name'),
                'email': customer_data.get('email'),
                'legal_entity_type': 'individual'
            }
            
            response = requests.post(
                f"{self.base_url}/counterparties",
                headers=self.get_headers(),
                json=payload
            )
            response.raise_for_status()
            
            counterparty = response.json()
            return {
                'success': True,
                'customer_id': counterparty['id'],
                'data': counterparty
            }
        except Exception as e:
            self.logger.error(f"Modern Treasury counterparty creation failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def process_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a payment order."""
        try:
            payload = {
                'type': 'ach',
                'amount': payment_data['amount'],
                'direction': 'credit',
                'originating_account_id': payment_data['originating_account_id'],
                'receiving_account_id': payment_data['receiving_account_id'],
                'currency': payment_data.get('currency', 'USD')
            }
            
            response = requests.post(
                f"{self.base_url}/payment_orders",
                headers=self.get_headers(),
                json=payload
            )
            response.raise_for_status()
            
            payment_order = response.json()
            return {
                'success': True,
                'payment_id': payment_order['id'],
                'status': payment_order['status'],
                'data': payment_order
            }
        except Exception as e:
            self.logger.error(f"Modern Treasury payment failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_balance(self, account_id: str) -> Dict[str, Any]:
        """Get account balance."""
        try:
            response = requests.get(
                f"{self.base_url}/internal_accounts/{account_id}/balance_reports",
                headers=self.get_headers()
            )
            response.raise_for_status()
            
            balance_data = response.json()
            return {
                'success': True,
                'balance': balance_data
            }
        except Exception as e:
            self.logger.error(f"Modern Treasury balance retrieval failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_account(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create an internal account."""
        try:
            payload = {
                'name': account_data['name'],
                'currency': account_data.get('currency', 'USD'),
                'legal_entity_id': account_data.get('legal_entity_id')
            }
            
            response = requests.post(
                f"{self.base_url}/internal_accounts",
                headers=self.get_headers(),
                json=payload
            )
            response.raise_for_status()
            
            account = response.json()
            return {
                'success': True,
                'account_id': account['id'],
                'data': account
            }
        except Exception as e:
            self.logger.error(f"Modern Treasury account creation failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
