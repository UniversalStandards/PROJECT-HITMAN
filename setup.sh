#!/bin/bash

# Create the main project folder
mkdir modern_treasury
cd modern_treasury || exit

# Create subfolders
mkdir -p gui gui/assets
mkdir -p ../stripe

# Create files
touch main.py

touch modern_treasury_helpers.py
touch ../stripe/main.py
touch ../stripe/stripe_helpers.py
touch ../gui/gui_main.py
touch ../gui/gui_helpers.py

# Print success message
echo "Folder and file structure created successfully!"