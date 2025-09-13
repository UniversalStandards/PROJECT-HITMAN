import os
from pathlib import Path

# Root folder files
Path("LICENSE").touch()
Path("Procfile").touch()
with open("README.md", "w") as f:
    f.write("# Payment Processor Project")

with open("runtime.txt", "w") as f:
    f.write("python-3.8.1")

# Main folders
folders = ["configs", "issuers", "models", "services", "tests"]
for folder in folders:
    os.makedirs(folder)
    Path(f"{folder}/__init__.py").touch()

# Sample files
with open("main.py", "w") as f:
    f.write("print('Payment processor app')")

with open("app.py", "w") as f:
    f.write("from .main import main\nmain()")
with open("requirements.txt", "w") as f:
    f.write("flask")
# Issuer folders
issuer_folders = ["issuers/credit_card", "issuers/paypal", "issuers/stripe"]
for issuer_folder in issuer_folders:
    os.makedirs(issuer_folder)
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
    os.makedirs(service_folder)
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


with open("configs/settings.py", "w") as f:
    f.write("DEBUG=True")

with open("tests/test_transactions.py", "w") as f:
    f.write("import unittest \n\nclass TestTransactions(unittest.TestCase):\n   pass")
