# Government Operations and Financial Accounting Platform (GOFAP)

GOFAP is a Python-based government financial platform built with Flask web framework, supporting payment processing via Stripe, Modern Treasury integrations, and a Tkinter GUI interface. The repository includes a comprehensive build system and CI/CD pipeline.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Environment Setup
- Python 3.12.3 is available at `/usr/bin/python3`
- Install system dependencies first:
  - `sudo apt-get update && sudo apt-get install -y python3-tk` -- takes 45+ seconds. NEVER CANCEL. Set timeout to 90+ minutes for system updates.
- Install Python dependencies:
  - `python3 -m pip install --upgrade pip` -- takes 6 seconds
  - `python3 -m pip install flake8 pytest flask stripe requests` -- takes 6 seconds

### Build and Test Process
- **CRITICAL**: All build files work correctly but have specific usage patterns:
  - `python3 build.py` -- creates directory structure, takes 0.03 seconds
  - `./setup.sh` -- creates additional folders, takes 0.02 seconds  
  - `./buildscript.bash` -- generic build script, currently exits with "no known project files" message
- Syntax validation: `find . -name "*.py" -exec python3 -m py_compile {} \;` -- takes 1 second
- Linting: 
  - Critical errors: `flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics` -- takes 0.15 seconds
  - Full linting: `flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics` -- takes 0.15 seconds
- Testing: `pytest` -- takes 0.5 seconds (no actual tests exist, expects exit code 5)

### Running Applications

#### Flask Web Application (WORKING END-TO-END)
- **ALWAYS works correctly and is fully functional**
- Start server: `python3 main.py` 
- Server starts in 3 seconds on http://127.0.0.1:5000
- Test endpoint: `curl http://127.0.0.1:5000` returns "Welcome to the Payment Processor App!"
- Use `timeout 10 python3 main.py` for quick testing
- Kill with Ctrl+C or process termination

#### GUI Application (IMPORT PATH ISSUES)
- Located in `gui/gui_main.py` 
- **DO NOT run directly** - has unresolved import path issues with modern_treasury modules
- GUI requires proper DISPLAY environment for Tkinter (not available in headless environments)

#### Module Testing
- Stripe helpers work correctly: `cd stripe && python3 -c "from stripe_helpers import create_stripe_customer"`
- Module imports work from correct directories but NOT from repository root

## Validation

- **ALWAYS test the Flask application end-to-end** after making changes:
  - Start the Flask app: `python3 main.py &`
  - Wait 3 seconds for startup
  - Test: `curl http://127.0.0.1:5000`
  - Verify response contains "Welcome to the Payment Processor App!"
  - Kill the process: `pkill -f "python3 main.py"`
- **ALWAYS run linting before commits**: `flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics`
- Build artifacts are excluded via .gitignore (do not commit __pycache__ directories)

## GitHub Actions CI Pipeline

The repository includes `.github/workflows/python-app.yml` which:
- Uses Python 3.10 (different from local Python 3.12.3)
- Installs dependencies exactly as validated above
- Runs the same flake8 checks
- Runs pytest (expects no tests, exit code 5 is normal)
- Triggers on pushes to main branch and pull requests

## Common Tasks

### Repository Structure
```
├── .github/workflows/python-app.yml  # CI/CD pipeline
├── main.py                          # Flask web application (WORKING)
├── build.py                         # Build script (creates directories)
├── buildscript.bash                 # Generic build detector
├── setup.sh                         # Folder structure setup
├── gui/                             # Tkinter GUI components
│   ├── gui_main.py                  # Main GUI (has import issues)
│   └── gui_helpers.py               # GUI helper functions
├── stripe/                          # Stripe integration
│   ├── main.py                      # Stripe customer creation
│   └── stripe_helpers.py            # Working stripe utilities
├── modern_treasury/                 # Modern Treasury integration
├── configs/settings.py              # Application settings (DEBUG=True)
├── tests/test_transactions.py       # Empty test class
└── [Generated directories from build.py]
```

### Key Files Content
- `main.py`: Flask application serving on port 5000 with route '/' returning welcome message
- `stripe/stripe_helpers.py`: Contains `create_stripe_customer(params)` function
- `configs/settings.py`: Simple `DEBUG=True` setting
- All build-generated files follow Python package structure

### Timing Expectations
- **NEVER CANCEL system updates** - apt-get operations take 45+ seconds to several minutes
- Flask application startup: 3 seconds
- Dependency installation: ~6 seconds each for pip operations  
- Linting: 0.15 seconds
- Full syntax check: 1 second
- Build scripts: under 0.1 seconds each

### Known Issues and Workarounds
- GUI application has import path issues with modern_treasury modules - module imports work from specific directories only
- Buildscript.bash doesn't recognize Python projects without setup.py - this is expected behavior
- Some code style warnings exist (51 total) but no critical errors
- Test framework exists but no actual tests are implemented

### Working vs Non-Working Components
- ✅ Flask web application - fully functional end-to-end
- ✅ Python module compilation and validation
- ✅ Linting with flake8  
- ✅ pytest runner (no tests to run but framework works)
- ✅ Stripe helpers when imported from correct directory
- ✅ CI/CD pipeline commands
- ❌ GUI application - import path issues prevent execution
- ❌ Cross-module imports from repository root
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
