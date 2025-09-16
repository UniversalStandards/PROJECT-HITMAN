import tkinter as tk
from tkinter import ttk
import os
import logging

# Try to import the newer async helpers first, fall back to compatibility mode
try:
    from gui_helpers import create_accounts  # Removed create_accounts_async from import
    HAS_ASYNC_HELPERS = True
except ImportError:
    # Fallback to simple synchronous functions for main branch compatibility
    HAS_ASYNC_HELPERS = False
    
    def create_accounts(service, api_key=None):
        """Simple fallback account creation function for compatibility."""
        logging.info(f"Creating {service} account (compatibility mode)")
        return f"mock_{service}_account"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get API keys from environment
stripe_api_key = os.environ.get("STRIPE_SECRET_KEY", "")
modern_treasury_api_key = os.environ.get("MODERN_TREASURY_API_KEY", "")


class AccountCreationGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Account Creation GUI - GOFAP Platform")

        self.tab_control = ttk.Notebook(root)

        # Modern Treasury Tab
        self.modern_treasury_tab = ttk.Frame(self.tab_control)
        self.tab_control.add(self.modern_treasury_tab, text="Modern Treasury")

        # Stripe Tab
        self.stripe_tab = ttk.Frame(self.tab_control)
        self.tab_control.add(self.stripe_tab, text="Stripe")

        self.tab_control.pack(expand=1, fill="both")

        # Initialize GUI elements
        self.create_modern_treasury_widgets()
        self.create_stripe_widgets()

    def create_modern_treasury_widgets(self):
        # Widgets for Modern Treasury tab
        ttk.Label(
            self.modern_treasury_tab, text="Modern Treasury Account Creation"
        ).grid(column=0, row=0, pady=10)
        
        ttk.Button(
            self.modern_treasury_tab,
            text="Create Account",
            command=self.create_modern_treasury_account,
        ).grid(column=0, row=1, pady=5)
        
        # Status label for feedback
        self.mt_status = ttk.Label(self.modern_treasury_tab, text="")
        self.mt_status.grid(column=0, row=2, pady=5)

    def create_stripe_widgets(self):
        # Widgets for Stripe tab
        ttk.Label(self.stripe_tab, text="Stripe Customer Creation").grid(
            column=0, row=0, pady=10
        )
        
        ttk.Button(
            self.stripe_tab, text="Create Customer", command=self.create_stripe_customer
        ).grid(column=0, row=1, pady=5)
        
        # Status label for feedback
        self.stripe_status = ttk.Label(self.stripe_tab, text="")
        self.stripe_status.grid(column=0, row=2, pady=5)

    def create_modern_treasury_account(self):
        """Call the function to create a Modern Treasury account."""
        try:
            self.mt_status.config(text="Creating account...")
            self.root.update()
            
            result = create_accounts("modern_treasury", api_key=modern_treasury_api_key)
            if result:
                self.mt_status.config(text=f"Account created: {result}")
                logger.info(f"Modern Treasury account created: {result}")
            else:
                self.mt_status.config(text="Failed to create account")
                logger.error("Failed to create Modern Treasury account")
        except Exception as e:
            self.mt_status.config(text=f"Error: {str(e)}")
            logger.error(f"Error creating Modern Treasury account: {e}")

    def create_stripe_customer(self):
        """Call the function to create a Stripe customer."""
        try:
            self.stripe_status.config(text="Creating customer...")
            self.root.update()
            
            result = create_accounts("stripe", api_key=stripe_api_key)
            if result:
                self.stripe_status.config(text=f"Customer created: {result}")
                logger.info(f"Stripe customer created: {result}")
            else:
                self.stripe_status.config(text="Failed to create customer")
                logger.error("Failed to create Stripe customer")
        except Exception as e:
            self.stripe_status.config(text=f"Error: {str(e)}")
            logger.error(f"Error creating Stripe customer: {e}")


if __name__ == "__main__":
    root = tk.Tk()
    app = AccountCreationGUI(root)
    root.mainloop()
