"""
Configuration management for data import operations.
"""

import os
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from .exceptions import ConfigurationError


@dataclass
class ImportConfig:
    """Configuration class for data import operations."""
    
    # Linear API configuration
    linear_api_key: Optional[str] = field(default=None)
    linear_workspace_id: Optional[str] = field(default=None)
    
    # GitHub API configuration
    github_token: Optional[str] = field(default=None)
    github_org: Optional[str] = field(default=None)
    
    # General configuration
    sync_interval_minutes: int = field(default=60)
    max_retries: int = field(default=3)
    timeout_seconds: int = field(default=30)
    
    # Database configuration
    database_url: Optional[str] = field(default=None)
    
    # Logging configuration
    log_level: str = field(default="INFO")
    log_file: Optional[str] = field(default=None)
    
    def __post_init__(self):
        """Load configuration from environment variables if not provided."""
        if not self.linear_api_key:
            self.linear_api_key = os.getenv('LINEAR_API_KEY')
            
        if not self.linear_workspace_id:
            self.linear_workspace_id = os.getenv('LINEAR_WORKSPACE_ID')
            
        if not self.github_token:
            self.github_token = os.getenv('GITHUB_TOKEN')
            
        if not self.github_org:
            self.github_org = os.getenv('GITHUB_ORG')
            
        if not self.database_url:
            self.database_url = os.getenv('DATABASE_URL', 'sqlite:///payment_processor.db')
    
    def validate(self) -> None:
        """Validate the configuration."""
        errors = []
        
        if not self.database_url:
            errors.append("Database URL is required")
            
        if self.sync_interval_minutes <= 0:
            errors.append("Sync interval must be positive")
            
        if self.max_retries < 0:
            errors.append("Max retries cannot be negative")
            
        if self.timeout_seconds <= 0:
            errors.append("Timeout must be positive")
            
        if errors:
            raise ConfigurationError(f"Configuration validation failed: {', '.join(errors)}")
    
    def get_service_config(self, service: str) -> Dict[str, Any]:
        """Get configuration for a specific service."""
        if service == 'linear':
            return {
                'api_key': self.linear_api_key,
                'workspace_id': self.linear_workspace_id,
                'timeout': self.timeout_seconds,
                'max_retries': self.max_retries
            }
        elif service == 'github':
            return {
                'token': self.github_token,
                'org': self.github_org,
                'timeout': self.timeout_seconds,
                'max_retries': self.max_retries
            }
        else:
            raise ConfigurationError(f"Unknown service: {service}")
    
    def is_service_enabled(self, service: str) -> bool:
        """Check if a service is properly configured and enabled."""
        if service == 'linear':
            return bool(self.linear_api_key and self.linear_workspace_id)
        elif service == 'github':
            return bool(self.github_token and self.github_org)
        else:
            return False


def load_config() -> ImportConfig:
    """Load and validate configuration."""
    config = ImportConfig()
    config.validate()
    return config
