"""
Base importer class providing common functionality for all data importers.
"""

import logging
import time
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from .config import ImportConfig
from .exceptions import ImportError, SyncError, RateLimitError


class BaseImporter(ABC):
    """Abstract base class for all data importers."""
    
    def __init__(self, config: ImportConfig, service_name: str):
        """Initialize the base importer.
        
        Args:
            config: Import configuration
            service_name: Name of the service (e.g., 'linear', 'github')
        """
        self.config = config
        self.service_name = service_name
        self.logger = logging.getLogger(f"data_import.{service_name}")
        self.last_sync_time: Optional[datetime] = None
        self.sync_stats = {
            'total_synced': 0,
            'errors': 0,
            'last_error': None
        }
        
        # Validate service configuration
        if not config.is_service_enabled(service_name):
            raise ImportError(f"Service {service_name} is not properly configured")
    
    @abstractmethod
    def fetch_data(self, since: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Fetch data from the external service.
        
        Args:
            since: Only fetch data modified since this timestamp
            
        Returns:
            List of data items to import
        """
        pass
    
    @abstractmethod
    def transform_data(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform raw data into the internal format.
        
        Args:
            raw_data: Raw data from the external service
            
        Returns:
            Transformed data ready for storage
        """
        pass
    
    @abstractmethod
    def store_data(self, transformed_data: List[Dict[str, Any]]) -> int:
        """Store transformed data in the database.
        
        Args:
            transformed_data: Data ready for storage
            
        Returns:
            Number of items stored
        """
        pass
    
    def sync(self, full_sync: bool = False) -> Dict[str, Any]:
        """Perform a data synchronization.
        
        Args:
            full_sync: If True, perform a full sync ignoring last sync time
            
        Returns:
            Sync results dictionary
        """
        start_time = datetime.now()
        self.logger.info(f"Starting {'full' if full_sync else 'incremental'} sync for {self.service_name}")
        
        try:
            # Determine since timestamp for incremental sync
            since = None if full_sync else self.last_sync_time
            
            # Fetch data with retry logic
            raw_data = self._fetch_with_retry(since)
            
            if not raw_data:
                self.logger.info(f"No new data to sync for {self.service_name}")
                return {
                    'success': True,
                    'items_synced': 0,
                    'duration': (datetime.now() - start_time).total_seconds(),
                    'message': 'No new data to sync'
                }
            
            # Transform data
            transformed_data = self.transform_data(raw_data)
            
            # Store data
            items_stored = self.store_data(transformed_data)
            
            # Update sync statistics
            self.last_sync_time = start_time
            self.sync_stats['total_synced'] += items_stored
            
            duration = (datetime.now() - start_time).total_seconds()
            self.logger.info(f"Sync completed for {self.service_name}: {items_stored} items in {duration:.2f}s")
            
            return {
                'success': True,
                'items_synced': items_stored,
                'duration': duration,
                'message': f'Successfully synced {items_stored} items'
            }
            
        except Exception as e:
            self.sync_stats['errors'] += 1
            self.sync_stats['last_error'] = str(e)
            self.logger.error(f"Sync failed for {self.service_name}: {e}")
            
            return {
                'success': False,
                'items_synced': 0,
                'duration': (datetime.now() - start_time).total_seconds(),
                'error': str(e)
            }
    
    def _fetch_with_retry(self, since: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Fetch data with retry logic and rate limit handling."""
        max_retries = self.config.max_retries
        
        for attempt in range(max_retries + 1):
            try:
                return self.fetch_data(since)
                
            except RateLimitError as e:
                if attempt < max_retries:
                    # Exponential backoff for rate limits
                    wait_time = 2 ** attempt * 60  # 1, 2, 4 minutes
                    self.logger.warning(f"Rate limit hit, waiting {wait_time}s before retry {attempt + 1}/{max_retries}")
                    time.sleep(wait_time)
                else:
                    raise e
                    
            except Exception as e:
                if attempt < max_retries:
                    wait_time = 2 ** attempt  # 1, 2, 4 seconds
                    self.logger.warning(f"Fetch failed, retrying in {wait_time}s: {e}")
                    time.sleep(wait_time)
                else:
                    raise e
        
        return []
    
    def get_sync_status(self) -> Dict[str, Any]:
        """Get current sync status and statistics."""
        return {
            'service': self.service_name,
            'last_sync': self.last_sync_time.isoformat() if self.last_sync_time else None,
            'total_synced': self.sync_stats['total_synced'],
            'errors': self.sync_stats['errors'],
            'last_error': self.sync_stats['last_error'],
            'is_configured': self.config.is_service_enabled(self.service_name)
        }
    
    def validate_connection(self) -> bool:
        """Validate connection to the external service.
        
        Returns:
            True if connection is valid, False otherwise
        """
        try:
            # Try to fetch a small amount of data to test connection
            test_data = self.fetch_data()
            return True
        except Exception as e:
            self.logger.error(f"Connection validation failed for {self.service_name}: {e}")
            return False
