import os

DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 'yes')
"""Configuration settings for GOFAP (Government Operations and Financial Accounting Platform)."""

import os
from typing import Any

# Debug mode setting
DEBUG = os.environ.get("FLASK_DEBUG", "True").lower() in (
    "true",
    "1",
    "yes",
    "on",
)
DEBUG = os.environ.get("FLASK_DEBUG", "True").lower() in ("true", "1", "yes", "on")

# Database configuration
DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///gofap.db")
# Fix for SQLAlchemy 2.0+ compatibility - replace postgres:// with postgresql://
if DATABASE_URI and DATABASE_URI.startswith("postgres://"):
    DATABASE_URI = DATABASE_URI.replace("postgres://", "postgresql://", 1)

# API Configuration
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")
MODERN_TREASURY_API_KEY = os.environ.get("MODERN_TREASURY_API_KEY", "")
MODERN_TREASURY_ORG_ID = os.environ.get("MODERN_TREASURY_ORG_ID", "")

# Security configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-in-production")

# Application configuration
APP_NAME = "Government Operations and Financial Accounting Platform (GOFAP)"
VERSION = "1.0.0"


# Data import settings
LINEAR_API_KEY = os.environ.get('LINEAR_API_KEY')
LINEAR_WORKSPACE_ID = os.environ.get('LINEAR_WORKSPACE_ID')
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
GITHUB_ORG = os.environ.get('GITHUB_ORG')

# Sync settings
SYNC_INTERVAL_MINUTES = int(os.environ.get('SYNC_INTERVAL_MINUTES', '60'))
MAX_RETRIES = int(os.environ.get('MAX_RETRIES', '3'))
TIMEOUT_SECONDS = int(os.environ.get('TIMEOUT_SECONDS', '30'))

# Logging settings
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
LOG_FILE = os.environ.get('LOG_FILE')

def get_config(key: str, default: Any = None) -> Any:
    """Get configuration value with fallback to default."""
    return os.environ.get(key, default)
