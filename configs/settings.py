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


def get_config(key: str, default: Any = None) -> Any:
    """Get configuration value with fallback to default."""
    return os.environ.get(key, default)
