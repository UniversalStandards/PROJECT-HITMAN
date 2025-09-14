"""
Custom exceptions for the data import module.
"""


class ImportError(Exception):
    """Base exception for data import operations."""
    pass


class SyncError(ImportError):
    """Exception raised when synchronization fails."""
    pass


class ConfigurationError(ImportError):
    """Exception raised when configuration is invalid or missing."""
    pass


class AuthenticationError(ImportError):
    """Exception raised when authentication fails."""
    pass


class RateLimitError(ImportError):
    """Exception raised when API rate limits are exceeded."""
    pass


class DataValidationError(ImportError):
    """Exception raised when imported data fails validation."""
    pass
