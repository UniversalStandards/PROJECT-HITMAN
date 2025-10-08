
import os
import requests
import base64
from typing import Dict, Any, Optional
from ..service import Service

class PaypalService(Service):
    """Complete PayPal payment service implementation."""
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)
        self.client_id = os.environ.get('PAYPAL_CLIENT_ID')
        self.client_secret = os.environ.get('PAYPAL_CLIENT_SECRET')
        self.sandbox = os.environ.get('PAYPAL_SANDBOX', 'true').lower() == 'true'
        self.base_url = "https://api.sandbox.paypal.com" if self.sandbox else "https://api.paypal.com"
        self.access_token = None
    
    def get_api_key(self) -> str:
        """Get PayPal credentials."""
        if not self.client_id or not self.client_secret:
            raise ValueError("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables are required")
        return f"{self.client_id}:{self.client_secret}"
    
    def get_access_token(self) -> str:
        """Get PayPal access token."""
        if self.access_token:
            return self.access_token
            
        auth = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        headers = {
            'Authorization': f'Basic {auth}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        data = 'grant_type=client_credentials'
        
        response = requests.post(f"{self.base_url}/v1/oauth2/token", headers=headers, data=data)
        response.raise_for_status()
        
        self.access_token = response.json()['access_token']
        return self.access_token
    
    def create_customer(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a PayPal customer (vault customer)."""
        try:
            headers = {
                'Authorization': f'Bearer {self.get_access_token()}',
                'Content-Type': 'application/json'
            }
            
            customer_payload = {
                'given_name': customer_data.get('name', '').split(' ')[0],
                'surname': ' '.join(customer_data.get('name', '').split(' ')[1:]),
                'email_address': customer_data.get('email'),
                'phone': {
                    'phone_number': {
                        'national_number': customer_data.get('phone', '')
                    }
                }
            }
            
            response = requests.post(
                f"{self.base_url}/v1/customer/vault/customers",
                headers=headers,
                json=customer_payload
            )
            response.raise_for_status()
            
            customer = response.json()
            return {
                'success': True,
                'customer_id': customer['id'],
                'data': customer
            }
        except Exception as e:
            self.logger.error(f"PayPal customer creation failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def process_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a payment through PayPal."""
        try:
            headers = {
                'Authorization': f'Bearer {self.get_access_token()}',
                'Content-Type': 'application/json'
            }
            
            payment_payload = {
                'intent': 'CAPTURE',
                'purchase_units': [{
                    'amount': {
                        'currency_code': payment_data.get('currency', 'USD'),
                        'value': str(payment_data['amount'] / 100)  # Convert from cents
                    }
                }]
            }
            
            # Create order
            response = requests.post(
                f"{self.base_url}/v2/checkout/orders",
                headers=headers,
                json=payment_payload
            )
            response.raise_for_status()
            
            order = response.json()
            return {
                'success': True,
                'payment_id': order['id'],
                'status': order['status'],
                'data': order
            }
        except Exception as e:
            self.logger.error(f"PayPal payment failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_balance(self, account_id: str = None) -> Dict[str, Any]:
        """Get PayPal account balance."""
        try:
            headers = {
                'Authorization': f'Bearer {self.get_access_token()}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f"{self.base_url}/v1/reporting/balances",
                headers=headers
            )
            response.raise_for_status()
            
            balance_data = response.json()
            return {
                'success': True,
                'balances': balance_data.get('balances', [])
            }
        except Exception as e:
            self.logger.error(f"PayPal balance retrieval failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_account(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a PayPal merchant account."""
        # PayPal merchant account creation requires partner API access
        # For now, return a placeholder response
        return {
            'success': False,
            'error': 'PayPal merchant account creation requires partner API access'
        }
