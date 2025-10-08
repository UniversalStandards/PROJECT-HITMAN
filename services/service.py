
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import os

logger = logging.getLogger(__name__)

class Service(ABC):
    """Base service class for all payment integrations."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or self.get_api_key()
        self.logger = logging.getLogger(self.__class__.__name__)
    
    @abstractmethod
    def get_api_key(self) -> str:
        """Get API key from environment variables."""
        pass
    
    @abstractmethod
    def create_customer(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a customer in the service."""
        pass
    
    @abstractmethod
    def process_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a payment through the service."""
        pass
    
    @abstractmethod
    def get_balance(self, account_id: str) -> Dict[str, Any]:
        """Get account balance."""
        pass
    
    @abstractmethod
    def create_account(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create an account in the service."""
        pass
