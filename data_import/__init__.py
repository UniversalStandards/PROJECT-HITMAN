"""
Data Import Module for GOFAP Platform

This module provides comprehensive data import and synchronization capabilities
for integrating with various external services including Linear, GitHub, and other tools.
"""

from .base_importer import BaseImporter
from .config import ImportConfig
from .exceptions import ImportError, SyncError, ConfigurationError

__version__ = "1.0.0"
__all__ = [
    "BaseImporter",
    "ImportConfig", 
    "ImportError",
    "SyncError",
    "ConfigurationError"
]
