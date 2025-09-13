#!/bin/bash

# Create the main project folder
mkdir modern_treasury
cd modern_treasury



# Create subfolder
mkdir -p modern_treasury/gui
mkdir -p modern_treasury/gui/assets
mkdir -p stripe
mkdir -p gui

# Create files
touch modern_treasury/main.py
touch modern_treasury/modern_treasury_helpers.py
touch stripe/main.py
touch stripe/stripe_helpers.py
touch gui/gui_main.py
touch gui/gui_helpers.py
touch gui/gui_main.py
touch gui/gui_helpers.py

# Print success message
echo "Folder and file structure created successfully!"