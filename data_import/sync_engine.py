"""
Core sync engine for managing data synchronization across multiple services.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

from .config import ImportConfig
from .linear_importer import LinearImporter
from .github_importer import GitHubImporter
from .exceptions import ImportError, SyncError
from data_import_models.imported_data import SyncStatus, ImportedData, Base


class SyncEngine:
    """Core engine for managing data synchronization."""
    
    def __init__(self, config: ImportConfig):
        """Initialize the sync engine.
        
        Args:
            config: Import configuration
        """
        self.config = config
        self.logger = logging.getLogger("data_import.sync_engine")
        
        # Initialize database
        self.engine = create_engine(config.database_url)
        Base.metadata.create_all(self.engine)
        
        # Initialize importers
        self.importers = {}
        self._initialize_importers()
    
    def _initialize_importers(self):
        """Initialize available importers based on configuration."""
        if self.config.is_service_enabled('linear'):
            try:
                self.importers['linear'] = LinearImporter(self.config)
                self.logger.info("Linear importer initialized")
            except Exception as e:
                self.logger.error(f"Failed to initialize Linear importer: {e}")
        
        if self.config.is_service_enabled('github'):
            try:
                self.importers['github'] = GitHubImporter(self.config)
                self.logger.info("GitHub importer initialized")
            except Exception as e:
                self.logger.error(f"Failed to initialize GitHub importer: {e}")
        
        self.logger.info(f"Initialized {len(self.importers)} importers: {list(self.importers.keys())}")
    
    def sync_all_services(self, full_sync: bool = False) -> Dict[str, Any]:
        """Sync data from all configured services.
        
        Args:
            full_sync: If True, perform full sync for all services
            
        Returns:
            Dictionary with sync results for each service
        """
        results = {}
        
        for service_name in self.importers.keys():
            try:
                result = self.sync_service(service_name, full_sync=full_sync)
                results[service_name] = result
            except Exception as e:
                self.logger.error(f"Failed to sync {service_name}: {e}")
                results[service_name] = {
                    'success': False,
                    'error': str(e),
                    'items_synced': 0
                }
        
        return results
    
    def sync_service(self, service_name: str, full_sync: bool = False) -> Dict[str, Any]:
        """Sync data from a specific service.
        
        Args:
            service_name: Name of the service to sync
            full_sync: If True, perform full sync ignoring last sync time
            
        Returns:
            Sync result dictionary
        """
        if service_name not in self.importers:
            raise SyncError(f"Service {service_name} is not configured")
        
        importer = self.importers[service_name]
        
        with Session(self.engine) as session:
            # Get or create sync status record
            sync_status = session.query(SyncStatus).filter_by(service=service_name).first()
            if not sync_status:
                sync_status = SyncStatus(service=service_name)
                session.add(sync_status)
                session.commit()
            
            # Check if sync is enabled
            if not sync_status.sync_enabled:
                self.logger.info(f"Sync disabled for {service_name}")
                return {
                    'success': False,
                    'message': f'Sync disabled for {service_name}',
                    'items_synced': 0
                }
            
            # Update sync attempt counter
            sync_status.total_sync_attempts += 1
            sync_status.last_sync_at = datetime.utcnow()
            
            try:
                # Perform the sync
                result = importer.sync(full_sync=full_sync)
                
                if result['success']:
                    # Update success statistics
                    sync_status.last_successful_sync_at = datetime.utcnow()
                    sync_status.total_items_synced += result['items_synced']
                    
                    # Store the synced data in database
                    if 'transformed_data' in result:
                        self._store_imported_data(session, service_name, result['transformed_data'])
                else:
                    # Update error statistics
                    sync_status.total_errors += 1
                    sync_status.last_error_at = datetime.utcnow()
                    sync_status.last_error_message = result.get('error', 'Unknown error')
                
                session.commit()
                return result
                
            except Exception as e:
                # Update error statistics
                sync_status.total_errors += 1
                sync_status.last_error_at = datetime.utcnow()
                sync_status.last_error_message = str(e)
                session.commit()
                
                self.logger.error(f"Sync failed for {service_name}: {e}")
                return {
                    'success': False,
                    'error': str(e),
                    'items_synced': 0
                }
    
    def _store_imported_data(self, session: Session, service_name: str, data_items: List[Dict[str, Any]]):
        """Store imported data in the database.
        
        Args:
            session: Database session
            service_name: Name of the service
            data_items: List of data items to store
        """
        for item in data_items:
            try:
                # Check if item already exists
                existing_item = session.query(ImportedData).filter_by(
                    source=service_name,
                    external_id=item['external_id']
                ).first()
                
                if existing_item:
                    # Update existing item
                    existing_item.title = item.get('title')
                    existing_item.description = item.get('description')
                    existing_item.state = item.get('state')
                    existing_item.external_updated_at = item.get('updated_at')
                    existing_item.processed_data = item
                    existing_item.last_synced_at = datetime.utcnow()
                    existing_item.sync_version += 1
                else:
                    # Create new item
                    new_item = ImportedData(
                        source=service_name,
                        data_type=item['data_type'],
                        external_id=item['external_id'],
                        title=item.get('title'),
                        description=item.get('description'),
                        state=item.get('state'),
                        external_created_at=item.get('created_at'),
                        external_updated_at=item.get('updated_at'),
                        raw_data=item.get('raw_data'),
                        processed_data=item,
                        last_synced_at=datetime.utcnow()
                    )
                    session.add(new_item)
                
            except Exception as e:
                self.logger.error(f"Failed to store item {item.get('external_id', 'unknown')}: {e}")
                continue
        
        session.commit()
    
    def get_sync_status(self, service_name: Optional[str] = None) -> Dict[str, Any]:
        """Get sync status for services.
        
        Args:
            service_name: Specific service name, or None for all services
            
        Returns:
            Sync status information
        """
        with Session(self.engine) as session:
            if service_name:
                sync_status = session.query(SyncStatus).filter_by(service=service_name).first()
                if sync_status:
                    return sync_status.to_dict()
                else:
                    return {'error': f'Service {service_name} not found'}
            else:
                # Get status for all services
                all_status = session.query(SyncStatus).all()
                return {
                    'services': [status.to_dict() for status in all_status],
                    'total_services': len(all_status),
                    'healthy_services': sum(1 for status in all_status if status.is_healthy)
                }
    
    def enable_service_sync(self, service_name: str, enabled: bool = True):
        """Enable or disable sync for a service.
        
        Args:
            service_name: Name of the service
            enabled: Whether to enable or disable sync
        """
        with Session(self.engine) as session:
            sync_status = session.query(SyncStatus).filter_by(service=service_name).first()
            if sync_status:
                sync_status.sync_enabled = enabled
                session.commit()
                self.logger.info(f"Sync {'enabled' if enabled else 'disabled'} for {service_name}")
            else:
                raise SyncError(f"Service {service_name} not found")
    
    def set_sync_interval(self, service_name: str, interval_minutes: int):
        """Set sync interval for a service.
        
        Args:
            service_name: Name of the service
            interval_minutes: Sync interval in minutes
        """
        if interval_minutes <= 0:
            raise ValueError("Sync interval must be positive")
        
        with Session(self.engine) as session:
            sync_status = session.query(SyncStatus).filter_by(service=service_name).first()
            if sync_status:
                sync_status.sync_interval_minutes = interval_minutes
                session.commit()
                self.logger.info(f"Sync interval set to {interval_minutes} minutes for {service_name}")
            else:
                raise SyncError(f"Service {service_name} not found")
    
    def get_imported_data(self, source: Optional[str] = None, data_type: Optional[str] = None, 
                         limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get imported data with optional filtering.
        
        Args:
            source: Filter by source service
            data_type: Filter by data type
            limit: Maximum number of items to return
            offset: Number of items to skip
            
        Returns:
            List of imported data items
        """
        with Session(self.engine) as session:
            query = session.query(ImportedData)
            
            if source:
                query = query.filter(ImportedData.source == source)
            
            if data_type:
                query = query.filter(ImportedData.data_type == data_type)
            
            query = query.order_by(ImportedData.external_updated_at.desc())
            query = query.offset(offset).limit(limit)
            
            items = query.all()
            return [item.to_dict() for item in items]
    
    def get_services_needing_sync(self) -> List[str]:
        """Get list of services that need synchronization.
        
        Returns:
            List of service names that need sync
        """
        services_needing_sync = []
        
        with Session(self.engine) as session:
            for service_name in self.importers.keys():
                sync_status = session.query(SyncStatus).filter_by(service=service_name).first()
                
                if not sync_status or not sync_status.sync_enabled:
                    continue
                
                # Check if enough time has passed since last sync
                if sync_status.last_sync_at:
                    time_since_sync = datetime.utcnow() - sync_status.last_sync_at
                    if time_since_sync.total_seconds() / 60 >= sync_status.sync_interval_minutes:
                        services_needing_sync.append(service_name)
                else:
                    # Never synced before
                    services_needing_sync.append(service_name)
        
        return services_needing_sync
    
    def validate_all_connections(self) -> Dict[str, bool]:
        """Validate connections to all configured services.
        
        Returns:
            Dictionary mapping service names to connection status
        """
        results = {}
        
        for service_name, importer in self.importers.items():
            try:
                results[service_name] = importer.validate_connection()
            except Exception as e:
                self.logger.error(f"Connection validation failed for {service_name}: {e}")
                results[service_name] = False
        
        return results
