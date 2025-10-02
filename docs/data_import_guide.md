# Data Import Guide for GOFAP

The Government Operations and Financial Accounting Platform (GOFAP) includes comprehensive data import and synchronization capabilities for integrating with external services like Linear and GitHub.

## Overview

The data import system allows you to:
- Sync data from Linear (issues, projects, teams, users)
- Sync data from GitHub (repositories, issues, pull requests, commits)
- Schedule automatic synchronization
- Monitor sync status and health
- Manage imported data through web interface and CLI

## Configuration

### Environment Variables

Set the following environment variables to configure the data import system:

```bash
# Linear API Configuration
LINEAR_API_KEY=your_linear_api_key
LINEAR_WORKSPACE_ID=your_workspace_id  # Optional

# GitHub API Configuration  
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_ORG=your_organization_name  # Optional

# Sync Configuration
SYNC_INTERVAL_MINUTES=60  # How often to sync (default: 60 minutes)
MAX_RETRIES=3             # Max retry attempts (default: 3)
TIMEOUT_SECONDS=30        # Request timeout (default: 30 seconds)

# Database
DATABASE_URL=sqlite:///payment_processor.db  # Or your database URL

# Logging
LOG_LEVEL=INFO            # Logging level (default: INFO)
LOG_FILE=data_import.log  # Optional log file
```

### Getting API Keys

#### Linear API Key
1. Go to Linear Settings → API
2. Create a new Personal API Key
3. Copy the key and set it as `LINEAR_API_KEY`

#### GitHub Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with appropriate scopes:
   - `repo` (for private repositories)
   - `read:org` (for organization data)
3. Copy the token and set it as `GITHUB_TOKEN`

## Usage

### Web Interface

Access the data import dashboard at: `http://localhost:5000/data-import/`

The dashboard provides:
- **Scheduler Status**: Start/stop the automatic sync scheduler
- **Service Status**: View sync status for each service (Linear, GitHub)
- **Connection Status**: Test connections to external APIs
- **Quick Actions**: Trigger manual syncs
- **Data Viewer**: Browse imported data with filtering

### CLI Commands

The system includes comprehensive CLI commands for automation:

```bash
# Initialize database tables
flask data-import init-db

# Show configuration
flask data-import config-info

# Test connections
flask data-import test-connections

# Sync data
flask data-import sync                    # Sync all services
flask data-import sync --service linear   # Sync specific service
flask data-import sync --full             # Full sync (not incremental)

# View sync status
flask data-import status

# List imported data
flask data-import list-data
flask data-import list-data --source linear --type issue

# Configure services
flask data-import configure-service linear --enabled
flask data-import configure-service github --disabled
flask data-import set-interval linear 30  # Set sync interval to 30 minutes

# Start scheduler (runs until Ctrl+C)
flask data-import start-scheduler
```

## Data Model

### Imported Data Structure

All imported data is stored in a unified format with these common fields:

- `source`: Service name (linear, github)
- `data_type`: Type of data (issue, project, repository, etc.)
- `external_id`: ID from the external service
- `title`: Item title/name
- `description`: Item description/body
- `state`: Current state
- `created_at`: When created locally
- `updated_at`: When last updated locally
- `external_created_at`: When created in external service
- `external_updated_at`: When last updated in external service
- `raw_data`: Complete raw data from external service
- `processed_data`: Transformed data in internal format

### Sync Status Tracking

Each service has a sync status record tracking:
- Last sync time
- Total items synced
- Success rate
- Error information
- Configuration (enabled/disabled, sync interval)

## Architecture

### Components

1. **Base Importer**: Abstract base class for all importers
2. **Service Clients**: API clients for Linear and GitHub
3. **Importers**: Service-specific data importers
4. **Sync Engine**: Orchestrates synchronization across services
5. **Scheduler**: Handles automatic periodic syncing
6. **Web Interface**: Flask routes and templates for management
7. **CLI Commands**: Command-line interface for automation

### Data Flow

1. **Fetch**: Retrieve data from external API
2. **Transform**: Convert to internal format
3. **Store**: Save to database with deduplication
4. **Track**: Update sync status and statistics

### Error Handling

- Automatic retry with exponential backoff
- Rate limit handling
- Connection validation
- Comprehensive error logging
- Graceful degradation

## Monitoring

### Health Checks

The system provides several ways to monitor health:

- **Connection Tests**: Validate API connectivity
- **Sync Status**: Track success rates and error counts
- **Service Health**: Automatic health assessment based on recent syncs
- **Scheduler Status**: Monitor if automatic sync is running

### Logging

All operations are logged with appropriate levels:
- INFO: Normal operations, sync completions
- WARNING: Recoverable errors, rate limits
- ERROR: Sync failures, connection issues
- DEBUG: Detailed operation information

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify API keys are correct and not expired
   - Check token permissions/scopes

2. **Rate Limiting**
   - System automatically handles rate limits with backoff
   - Consider reducing sync frequency if hitting limits frequently

3. **Connection Timeouts**
   - Increase `TIMEOUT_SECONDS` if needed
   - Check network connectivity

4. **Database Errors**
   - Ensure database is accessible
   - Run `flask data-import init-db` to create tables

### Getting Help

- Check logs for detailed error information
- Use `flask data-import test-connections` to validate setup
- Use `flask data-import status` to check service health
- Review configuration with `flask data-import config-info`

## Security Considerations

- Store API keys securely as environment variables
- Use HTTPS for all API communications
- Regularly rotate API keys
- Monitor access logs for unusual activity
- Limit API token permissions to minimum required scopes

## Performance

### Optimization Tips

- Use incremental sync (default) instead of full sync when possible
- Adjust sync intervals based on data change frequency
- Monitor database size and consider archiving old data
- Use appropriate database indexes for query performance

### Scaling

For high-volume environments:
- Consider using a more robust database (PostgreSQL)
- Implement database connection pooling
- Use Redis for caching frequently accessed data
- Deploy scheduler as separate service for reliability
