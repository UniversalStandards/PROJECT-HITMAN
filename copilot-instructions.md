# Copilot Instructions for GOFAP (Government Operations and Financial Accounting Platform)

## Repository Overview

This repository contains the **Government Operations and Financial Accounting Platform (GOFAP)**, a comprehensive financial management system designed specifically for government entities. The platform provides:

- Digital account and card creation through Modern Treasury and Stripe integrations
- Payment processing and treasury management
- HR management systems
- Constituent services portal
- Procurement and expense management
- Security and compliance features for government use

## Code Review Guidelines

### General Principles

1. **Security First**: Always prioritize security considerations in government financial software
2. **Compliance**: Ensure code adheres to government standards and regulations
3. **Performance**: Financial systems require high performance and reliability
4. **Documentation**: Government software requires thorough documentation
5. **Error Handling**: Robust error handling is critical for financial operations

### Technology Stack

- **Backend**: Python with Flask framework
- **Database**: SQLAlchemy with SQLite/PostgreSQL
- **Payment Processing**: Stripe API integration
- **Treasury Management**: Modern Treasury API integration
- **Frontend**: HTML/CSS/JavaScript (in gui/ directory)
- **Deployment**: Python scripts with bash automation

### Review Focus Areas

#### Python Code (`*.py`)
- Check for proper exception handling, especially in payment processing
- Ensure API keys and secrets are properly managed (environment variables)
- Verify input validation for financial data
- Look for SQL injection vulnerabilities in database operations
- Ensure proper logging for audit trails
- Check for compliance with PEP 8 style guidelines

#### API Integrations
- **Modern Treasury**: Review treasury management operations for accuracy
- **Stripe**: Ensure payment processing follows best practices
- Verify proper error handling for API failures
- Check rate limiting and retry logic
- Ensure sensitive data is not logged

#### Configuration Files (`*.yml`, `*.yaml`, `*.json`)
- Review GitHub Actions workflows for security
- Check dependency management configurations
- Ensure proper environment variable usage
- Verify Docker configurations if present

#### Frontend Code (`gui/`)
- Check for XSS vulnerabilities
- Ensure proper form validation
- Review accessibility compliance
- Validate responsive design principles

#### Database Models
- Review for proper indexing on financial data
- Check for data integrity constraints
- Ensure proper foreign key relationships
- Verify audit trail capabilities

### Security Considerations

1. **Sensitive Data**: Never commit API keys, passwords, or sensitive configuration
2. **Input Validation**: All user inputs must be validated and sanitized
3. **Authentication**: Verify proper authentication and authorization
4. **Encryption**: Ensure sensitive data is encrypted at rest and in transit
5. **Audit Logging**: All financial operations must be logged
6. **Rate Limiting**: Implement proper rate limiting for APIs

### Government Compliance

- Ensure code follows government security standards
- Review for accessibility compliance (Section 508)
- Check for proper data retention policies
- Verify audit trail requirements are met
- Ensure proper user access controls

### Performance Guidelines

- Database queries should be optimized for financial data volumes
- API calls should include proper timeout handling
- Caching should be implemented where appropriate
- Memory usage should be monitored for long-running processes

### Testing Requirements

- Unit tests for all financial calculations
- Integration tests for API interactions
- Security tests for authentication and authorization
- Performance tests for high-volume operations

### Documentation Standards

- All public methods must have docstrings
- API endpoints must be documented
- Configuration options must be explained
- Deployment procedures must be clear
- Security considerations must be documented

## Common Issues to Watch For

1. **Hardcoded Secrets**: Look for API keys or passwords in code
2. **Unhandled Exceptions**: Especially in payment processing flows
3. **SQL Injection**: In custom database queries
4. **Missing Validation**: On financial amounts or account numbers
5. **Improper Error Messages**: That might reveal sensitive information
6. **Missing Logging**: For audit trail requirements
7. **Performance Issues**: In database operations or API calls

## Helpful Commands

- `python -m pytest` - Run test suite
- `python build.py` - Build the application
- `./buildscript.bash` - Run build script
- `python main.py` - Start the Flask application

## Questions to Ask During Review

1. Is this change secure for handling government financial data?
2. Does this maintain compliance with government regulations?
3. Is proper error handling implemented?
4. Are audit trails maintained?
5. Is the code well-documented for future maintainers?
6. Does this handle edge cases in financial operations?
7. Is performance acceptable for government-scale operations?

Remember: Government financial software has zero tolerance for security vulnerabilities or data loss. When in doubt, err on the side of caution and request additional security review.