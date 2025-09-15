# GOFAP - Government Operations and Financial Accounting Platform

**ALWAYS follow these instructions first and fallback to additional search and context gathering only if the information in the instructions is incomplete or found to be in error.**

## Overview
GOFAP is a Python Flask application for government financial operations with integrations to Stripe and Modern Treasury APIs. The system provides digital account creation, payment processing, treasury management, HR systems, and constituent services for government agencies.

## Working Effectively

### Bootstrap and Setup
**CRITICAL: Run these commands in exact order for first-time setup:**

1. **Install Python dependencies (takes ~20 seconds):**
   ```bash
   pip install -r requirements.txt
   ```

2. **Initialize database:**
   ```bash
   python -c "from main import app, db; app.app_context().push(); db.create_all(); print('Database initialized')"
   ```

### Build and Validation Commands
**NEVER CANCEL builds or validation - all commands complete quickly (under 5 minutes):**

1. **Critical syntax check (takes ~0.3 seconds - NEVER CANCEL):**
   ```bash
   flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
   ```

2. **Full code quality check (takes ~0.2 seconds - NEVER CANCEL):**
   ```bash
   flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
   ```

3. **Format code (takes ~0.4 seconds - NEVER CANCEL):**
   ```bash
   black .
   ```

4. **Type checking (takes ~0.2 seconds - NEVER CANCEL):**
   ```bash
   mypy --ignore-missing-imports --exclude="stripe/main.py" .
   ```

### Running the Application

1. **Development server:**
   ```bash
   python main.py
   ```
   - Runs on http://127.0.0.1:5000
   - Auto-reloads on file changes
   - Use Ctrl+C to stop

2. **Production server:**
   ```bash
   gunicorn --bind 127.0.0.1:8000 main:app
   ```
   - Runs on http://127.0.0.1:8000
   - Use Ctrl+C to stop

3. **Test endpoint:**
   ```bash
   curl http://127.0.0.1:5000/
   ```
   Expected response: "Welcome to the Government Operations and Financial Accounting Platform (GOFAP)!"

### Tests
```bash
pytest -v
```
- Currently no tests exist - creates empty test session
- Takes ~0.3 seconds - NEVER CANCEL

## Validation Scenarios
**ALWAYS run these complete scenarios after making changes:**

1. **Basic Application Flow:**
   - Start development server: `python main.py`
   - Test home endpoint: `curl http://127.0.0.1:5000/`
   - Verify response contains "GOFAP"
   - Stop server with Ctrl+C

2. **Production Deployment Test:**
   - Start production server: `gunicorn --bind 127.0.0.1:8000 main:app`
   - Test endpoint: `curl http://127.0.0.1:8000/`
   - Verify same response as development
   - Stop server with Ctrl+C

3. **Code Quality Validation:**
   - Run syntax check (must pass): `flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics`
   - Run formatting: `black .`
   - Run full lint: `flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics`

## Critical File Structure

```
/
├── main.py              # Main Flask application entry point
├── requirements.txt     # Python dependencies
├── configs/
│   ├── settings.py     # Configuration management
│   └── __init__.py
├── gui/                # GUI components (tkinter - requires display)
│   ├── gui_main.py     # Main GUI application
│   └── gui_helpers.py  # GUI helper functions
├── modern_treasury/    # Modern Treasury API integration
│   ├── main.py         # Modern Treasury example usage
│   └── modern_treasury_helpers.py  # API helpers
├── stripe/             # Stripe API integration
│   ├── main.py         # Stripe example usage  
│   └── stripe_helpers.py  # API helpers
└── .github/
    └── workflows/      # CI/CD pipelines
```

## Key Integration Points

### Stripe Integration
- **File**: `stripe/stripe_helpers.py`
- **Function**: `create_stripe_customer(params)`
- **Test**: `python -c "import stripe; print('Stripe SDK available')"`

### Modern Treasury Integration  
- **Files**: `modern_treasury/modern_treasury_helpers.py`
- **Note**: Helper functions use async patterns with exponential backoff
- **Important**: API integration requires valid API keys in environment variables

### Database
- **Type**: SQLite (development), configurable via `DATABASE_URL`
- **ORM**: SQLAlchemy with Flask-SQLAlchemy
- **Migrations**: Flask-Migrate (not currently configured)
- **Initialize**: Run database setup command from bootstrap section

## Environment Variables
Set these for full functionality:
- `FLASK_DEBUG=True` (development)
- `STRIPE_SECRET_KEY=your_key_here`  
- `STRIPE_PUBLISHABLE_KEY=your_key_here`
- `MODERN_TREASURY_API_KEY=your_key_here`
- `MODERN_TREASURY_ORG_ID=your_org_id`
- `SECRET_KEY=your_secret_key_here`

## CI/CD Integration
**GitHub Actions workflow** (`.github/workflows/python-app.yml`):
- Runs on push to main branch
- Installs dependencies, runs flake8, and pytest
- **Timing**: Complete workflow takes ~2 minutes - NEVER CANCEL

## Common Issues and Solutions

1. **Import errors**: Run `pip install -r requirements.txt`

2. **GUI not working**: tkinter requires display - GUI components won't work in headless environments

3. **Build script errors**: `build.py` creates project structure but fails if directories exist - this is normal for existing projects

4. **Linting issues**: Run `black .` to auto-format before other linting

5. **Type checking conflicts**: `mypy` reports duplicate module names between `stripe/main.py` and `modern_treasury/main.py` - exclude one during type checking

## Development Workflow
**ALWAYS follow this exact sequence:**

1. Make code changes
2. Run critical syntax check: `flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics`
3. Format code: `black .`
4. Test application: `python main.py` then `curl http://127.0.0.1:5000/`
5. Run full validation before committing

## Performance Expectations
**All operations complete quickly - timeouts not needed:**
- Dependency installation: ~20 seconds
- Linting: ~0.3 seconds  
- Formatting: ~0.4 seconds
- Type checking: ~0.2 seconds
- Application startup: ~1 second
- Test suite: ~0.3 seconds (empty suite)

## Security Notes
- Never commit API keys or secrets to version control
- All sensitive configuration uses environment variables
- Government-grade security standards apply
- Audit logging required for all financial operations
- Input validation mandatory for all user inputs

**REMEMBER**: This is government financial software - security and compliance are paramount. When in doubt, err on the side of caution and implement additional security measures.