# Configuration Directory

This directory contains configuration files for the Government Operations and Financial Accounting Platform (GOFAP).

## Files

- `settings.py` - Main configuration settings including API keys, database settings, and environment variables
- `__init__.py` - Python package initialization file

## Environment Variables

The following environment variables should be set in production:

- `FLASK_DEBUG` - Set to 'False' in production
- `DATABASE_URL` - Database connection string
- `SECRET_KEY` - Application secret key for security
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe API publishable key
- `MODERN_TREASURY_API_KEY` - Modern Treasury API key
- `MODERN_TREASURY_ORG_ID` - Modern Treasury organization ID

## Security Note

Never commit API keys, secrets, or sensitive configuration to version control. Use environment variables or secure configuration management systems in production.