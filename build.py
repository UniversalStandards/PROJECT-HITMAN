import os
from pathlib import Path

# Root folder files
Path("LICENSE").touch()
Path("Procfile").touch()
with open("README.md", "w") as f:
    f.write("# Payment Processor Project\n## Government Operations and Financial Accounting Platform (GOFAP)")

with open("runtime.txt", "w") as f:
    f.write("python-3.8.1")

# Main folders - enhanced structure for GOFAP
folders = ["configs", "issuers", "models", "services", "tests", "templates", "static"]
for folder in folders:
    os.makedirs(folder, exist_ok=True)
    Path(f"{folder}/__init__.py").touch()

# Static subdirectories for web interface
static_dirs = ["static/css", "static/js", "static/images"]
for static_dir in static_dirs:
    os.makedirs(static_dir, exist_ok=True)

# Sample files - enhanced for Flask web interface
with open("main.py", "w") as f:
    f.write("""import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Import configuration settings
try:
    from configs.settings import DEBUG
except ImportError:
    DEBUG = True

# Initialize Flask application
app = Flask(__name__)
app.config["DEBUG"] = DEBUG

# Initialize the database connection
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///payment_processor.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)

@app.route("/")
def home():
    return "Welcome to the Government Operations and Financial Accounting Platform (GOFAP)!"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="127.0.0.1", port=port, debug=DEBUG)
""")

with open("app.py", "w") as f:
    f.write("from main import app\n\nif __name__ == '__main__':\n    app.run()")

with open("requirements.txt", "w") as f:
    f.write("""flask
flask-sqlalchemy
flask-migrate
stripe
requests
""")

# Issuer folders
issuer_folders = ["issuers/credit_card", "issuers/paypal", "issuers/stripe"]
for issuer_folder in issuer_folders:
    os.makedirs(issuer_folder, exist_ok=True)
    Path(f"{issuer_folder}/__init__.py").touch()

# Issuer files
with open("issuers/credit_card/__init__.py", "w") as f:
    f.write("from .credit_card import CreditCardIssuer\nCreditCardIssuer()")
with open("issuers/credit_card/credit_card.py", "w") as f:
    f.write("from .issuer import Issuer\nclass CreditCardIssuer(Issuer):\n    pass")
with open("issuers/paypal/__init__.py", "w") as f:
    f.write("from .paypal import PaypalIssuer\nPaypalIssuer()")
with open("issuers/paypal/paypal.py", "w") as f:
    f.write("from .issuer import Issuer\nclass PaypalIssuer(Issuer):\n    pass")
with open("issuers/stripe/__init__.py", "w") as f:
    f.write("from .stripe import StripeIssuer\nStripeIssuer()")
with open("issuers/stripe/stripe.py", "w") as f:
    f.write("from .issuer import Issuer\nclass StripeIssuer(Issuer):\n    pass")

# Service folders
service_folders = ["services/credit_card", "services/paypal", "services/stripe"]
for service_folder in service_folders:
    os.makedirs(service_folder, exist_ok=True)
    Path(f"{service_folder}/__init__.py").touch()

# Service files
with open("services/credit_card/__init__.py", "w") as f:
    f.write("from .credit_card import CreditCardService\nCreditCardService()")
with open("services/credit_card/credit_card.py", "w") as f:
    f.write("from .service import Service\nclass CreditCardService(Service):\n    pass")
with open("services/paypal/__init__.py", "w") as f:
    f.write("from .paypal import PaypalService\nPaypalService()")
with open("services/paypal/paypal.py", "w") as f:
    f.write("from .service import Service\nclass PaypalService(Service):\n    pass")
with open("services/stripe/__init__.py", "w") as f:
    f.write("from .stripe import StripeService\nStripeService()")
with open("services/stripe/stripe.py", "w") as f:
    f.write("from .service import Service\nclass StripeService(Service):\n    pass")

# Enhanced configuration - merging main branch with improvements
with open("configs/settings.py", "w") as f:
    f.write("""\"\"\"Configuration settings for GOFAP (Government Operations and Financial Accounting Platform).\"\"\"

import os
from typing import Any

# Debug mode setting
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
    \"\"\"Get configuration value with fallback to default.\"\"\"
    return os.environ.get(key, default)
""")

with open("tests/test_transactions.py", "w") as f:
    f.write("import unittest \n\nclass TestTransactions(unittest.TestCase):\n    pass")
