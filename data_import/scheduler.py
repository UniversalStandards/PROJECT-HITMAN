"""
Scheduler for automated data synchronization.
"""

import logging
import time
import threading
from typing import Optional, Callable
from datetime import datetime

from .sync_engine import SyncEngine
from .config import ImportConfig


class SyncScheduler:
    """Scheduler for automated data synchronization."""
    
    def __init__(self, config: ImportConfig):
        """Initialize the scheduler.
        
        Args:
            config: Import configuration
        """
        self.config = config
        self.sync_engine = SyncEngine(config)
        self.logger = logging.getLogger("data_import.scheduler")
        
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        
        # Callbacks
        self.on_sync_complete: Optional[Callable] = None
        self.on_sync_error: Optional[Callable] = None
    
    def start(self, check_interval_seconds: int = 60):
        """Start the scheduler.
        
        Args:
            check_interval_seconds: How often to check for services needing sync
        """
        if self._running:
            self.logger.warning("Scheduler is already running")
            return
        
        self._running = True
        self._stop_event.clear()
        
        self._thread = threading.Thread(
            target=self._run_scheduler,
            args=(check_interval_seconds,),
            daemon=True
        )
        self._thread.start()
        
        self.logger.info(f"Scheduler started with check interval of {check_interval_seconds} seconds")
    
    def stop(self, timeout: int = 30):
        """Stop the scheduler.
        
        Args:
            timeout: Maximum time to wait for scheduler to stop
        """
        if not self._running:
            self.logger.warning("Scheduler is not running")
            return
        
        self.logger.info("Stopping scheduler...")
        self._running = False
        self._stop_event.set()
        
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=timeout)
            
            if self._thread.is_alive():
                self.logger.warning("Scheduler thread did not stop within timeout")
            else:
                self.logger.info("Scheduler stopped successfully")
        
        self._thread = None
    
    def _run_scheduler(self, check_interval_seconds: int):
        """Main scheduler loop.
        
        Args:
            check_interval_seconds: How often to check for services needing sync
        """
        self.logger.info("Scheduler loop started")
        
        while self._running and not self._stop_event.is_set():
            try:
                # Check which services need synchronization
                services_needing_sync = self.sync_engine.get_services_needing_sync()
                
                if services_needing_sync:
                    self.logger.info(f"Services needing sync: {services_needing_sync}")
                    
                    for service_name in services_needing_sync:
                        if not self._running:
                            break
                        
                        try:
                            self.logger.info(f"Starting scheduled sync for {service_name}")
                            result = self.sync_engine.sync_service(service_name)
                            
                            if result['success']:
                                self.logger.info(f"Scheduled sync completed for {service_name}: {result['items_synced']} items")
                                if self.on_sync_complete:
                                    self.on_sync_complete(service_name, result)
                            else:
                                self.logger.error(f"Scheduled sync failed for {service_name}: {result.get('error', 'Unknown error')}")
                                if self.on_sync_error:
                                    self.on_sync_error(service_name, result)
                        
                        except Exception as e:
                            self.logger.error(f"Exception during scheduled sync for {service_name}: {e}")
                            if self.on_sync_error:
                                self.on_sync_error(service_name, {'error': str(e)})
                
                # Wait for next check
                self._stop_event.wait(timeout=check_interval_seconds)
                
            except Exception as e:
                self.logger.error(f"Exception in scheduler loop: {e}")
                # Wait a bit before retrying to avoid tight error loops
                self._stop_event.wait(timeout=min(check_interval_seconds, 60))
        
        self.logger.info("Scheduler loop ended")
    
    def is_running(self) -> bool:
        """Check if the scheduler is running.
        
        Returns:
            True if scheduler is running, False otherwise
        """
        return self._running
    
    def sync_now(self, service_name: Optional[str] = None, full_sync: bool = False) -> dict:
        """Trigger an immediate sync.
        
        Args:
            service_name: Specific service to sync, or None for all services
            full_sync: Whether to perform a full sync
            
        Returns:
            Sync results
        """
        if service_name:
            self.logger.info(f"Manual sync triggered for {service_name}")
            return self.sync_engine.sync_service(service_name, full_sync=full_sync)
        else:
            self.logger.info("Manual sync triggered for all services")
            return self.sync_engine.sync_all_services(full_sync=full_sync)
    
    def get_status(self) -> dict:
        """Get scheduler and sync status.
        
        Returns:
            Status information
        """
        return {
            'scheduler_running': self._running,
            'sync_engine_status': self.sync_engine.get_sync_status(),
            'services_needing_sync': self.sync_engine.get_services_needing_sync(),
            'connection_status': self.sync_engine.validate_all_connections()
        }
    
    def set_sync_callbacks(self, on_complete: Optional[Callable] = None, 
                          on_error: Optional[Callable] = None):
        """Set callback functions for sync events.
        
        Args:
            on_complete: Callback for successful sync completion
            on_error: Callback for sync errors
        """
        self.on_sync_complete = on_complete
        self.on_sync_error = on_error
        self.logger.info("Sync callbacks configured")


def create_scheduler(config: Optional[ImportConfig] = None) -> SyncScheduler:
    """Create and configure a sync scheduler.
    
    Args:
        config: Import configuration, or None to load from environment
        
    Returns:
        Configured scheduler instance
    """
    if config is None:
        from .config import load_config
        config = load_config()
    
    return SyncScheduler(config)
