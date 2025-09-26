import os
from pathlib import Path

# Create necessary files in the root folder
root_files = ["LICENSE", "Procfile", "README.md", "runtime.txt"]
for file_name in root_files:
    with open(file_name, "w") as f:
        if file_name == "README.md":
            f.write("# Payment Processor Project")
        elif file_name == "runtime.txt":
            f.write("python-3.8.1")
    
# Define main folders
main_folders = ["configs", "issuers", "models", "services", "tests"]
for folder in main_folders:
    os.makedirs(folder, exist_ok=True)
    Path(f"{folder}/__init__.py").touch()

# Create sample files
sample_files = {
    "main.py": "print('Payment processor app')",
    "app.py": "from .main import main\nmain()",
    "requirements.txt": "flask"
}

for file_name, content in sample_files.items():
    with open(file_name, "w") as f:
        f.write(content)

# Define issuer subfolders and create __init__.py files
issuer_folders = ["credit_card", "paypal", "stripe"]
for issuer in issuer_folders:
    folder_path = f"issuers/{issuer}"
    os.makedirs(folder_path, exist_ok=True)
    with open(f"{folder_path}/__init__.py", "w") as f:
        f.write(f"from .{issuer} import {issuer.capitalize()}Issuer\n{issuer.capitalize()}Issuer()")
    with open(f"{folder_path}/{issuer}.py", "w") as f:
        f.write(f"from .issuer import Issuer\nclass {issuer.capitalize()}Issuer(Issuer):\n    pass")

# Define service subfolders and create __init__.py files
service_folders = ["credit_card", "paypal", "stripe"]
for service in service_folders:
    folder_path = f"services/{service}"
    os.makedirs(folder_path, exist_ok=True)
    with open(f"{folder_path}/__init__.py", "w") as f:
        f.write(f"from .{service} import {service.capitalize()}Service\n{service.capitalize()}Service()")
    with open(f"{folder_path}/{service}.py", "w") as f:
        f.write(f"from .service import Service\nclass {service.capitalize()}Service(Service):\n    pass")

# Create configs and test files
with open("configs/settings.py", "w") as f:
    f.write("DEBUG=True")  

with open("tests/test_transactions.py", "w") as f:
    f.write("import unittest\n\nclass TestTransactions(unittest.TestCase):\n    pass")
    
with open(".gitignore", "w") as f:
    f.write("\n".join([
        "__pycache__/",
        "*.py[cod]",
        "venv/",
        "env/",
        ".env",
        "*.log",
        "*.sqlite3"
    ]))