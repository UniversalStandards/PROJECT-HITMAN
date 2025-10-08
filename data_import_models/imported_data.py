"""
Database models for storing imported data from external services.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class ImportedData(Base):
    """Model for storing imported data from various external services."""
    
    __tablename__ = 'imported_data'
    
    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Source information
    source = Column(String(50), nullable=False, index=True)  # 'linear', 'github', etc.
    data_type = Column(String(50), nullable=False, index=True)  # 'issue', 'project', 'repository', etc.
    external_id = Column(String(255), nullable=False, index=True)  # ID from external service
    
    # Common fields
    title = Column(String(500))
    description = Column(Text)
    state = Column(String(100))
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    external_created_at = Column(DateTime)  # Created timestamp from external service
    external_updated_at = Column(DateTime)  # Updated timestamp from external service
    
    # Metadata
    raw_data = Column(JSON)  # Store the complete raw data from external service
    processed_data = Column(JSON)  # Store processed/transformed data
    
    # Sync tracking
    last_synced_at = Column(DateTime, default=func.now())
    sync_version = Column(Integer, default=1)  # Increment on each sync
    
    # Indexes for efficient querying
    __table_args__ = (
        Index('idx_source_type', 'source', 'data_type'),
        Index('idx_external_id_source', 'external_id', 'source'),
        Index('idx_external_updated', 'external_updated_at'),
        Index('idx_last_synced', 'last_synced_at'),
    )
    
    def __repr__(self):
        return f"<ImportedData(id={self.id}, source='{self.source}', type='{self.data_type}', external_id='{self.external_id}')>"
    
    def to_dict(self):
        """Convert model instance to dictionary."""
        return {
            'id': self.id,
            'source': self.source,
            'data_type': self.data_type,
            'external_id': self.external_id,
            'title': self.title,
            'description': self.description,
            'state': self.state,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'external_created_at': self.external_created_at.isoformat() if self.external_created_at else None,
            'external_updated_at': self.external_updated_at.isoformat() if self.external_updated_at else None,
            'last_synced_at': self.last_synced_at.isoformat() if self.last_synced_at else None,
            'sync_version': self.sync_version,
            'processed_data': self.processed_data,
        }


class SyncStatus(Base):
    """Model for tracking synchronization status for each service."""
    
    __tablename__ = 'sync_status'
    
    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Service information
    service = Column(String(50), nullable=False, unique=True, index=True)
    
    # Sync status
    last_sync_at = Column(DateTime)
    last_successful_sync_at = Column(DateTime)
    last_error_at = Column(DateTime)
    last_error_message = Column(Text)
    
    # Statistics
    total_items_synced = Column(Integer, default=0)
    total_sync_attempts = Column(Integer, default=0)
    total_errors = Column(Integer, default=0)
    
    # Configuration
    sync_enabled = Column(Boolean, default=True)
    sync_interval_minutes = Column(Integer, default=60)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<SyncStatus(service='{self.service}', last_sync='{self.last_sync_at}', enabled={self.sync_enabled})>"
    
    def to_dict(self):
        """Convert model instance to dictionary."""
        return {
            'id': self.id,
            'service': self.service,
            'last_sync_at': self.last_sync_at.isoformat() if self.last_sync_at else None,
            'last_successful_sync_at': self.last_successful_sync_at.isoformat() if self.last_successful_sync_at else None,
            'last_error_at': self.last_error_at.isoformat() if self.last_error_at else None,
            'last_error_message': self.last_error_message,
            'total_items_synced': self.total_items_synced,
            'total_sync_attempts': self.total_sync_attempts,
            'total_errors': self.total_errors,
            'sync_enabled': self.sync_enabled,
            'sync_interval_minutes': self.sync_interval_minutes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    @property
    def success_rate(self):
        """Calculate sync success rate as a percentage."""
        if self.total_sync_attempts == 0:
            return 0.0
        return ((self.total_sync_attempts - self.total_errors) / self.total_sync_attempts) * 100
    
    @property
    def is_healthy(self):
        """Check if the sync service is healthy (recent successful sync and low error rate)."""
        if not self.sync_enabled:
            return False
        
        # Check if we have a recent successful sync (within 2x the sync interval)
        if self.last_successful_sync_at:
            max_age_minutes = self.sync_interval_minutes * 2
            age_minutes = (datetime.utcnow() - self.last_successful_sync_at).total_seconds() / 60
            recent_success = age_minutes <= max_age_minutes
        else:
            recent_success = False
        
        # Check error rate (should be less than 50%)
        low_error_rate = self.success_rate >= 50.0
        
        return recent_success and low_error_rate
