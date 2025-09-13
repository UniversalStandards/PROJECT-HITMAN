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