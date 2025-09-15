import tkinter as tk
from tkinter import ttk
from gui_helpers import create_accounts
from configs.settings import STRIPE_SECRET_KEY, MODERN_TREASURY_API_KEY


class AccountCreationGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Account Creation GUI")

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
        ).grid(column=0, row=0)
        ttk.Button(
            self.modern_treasury_tab,
            text="Create Account",
            command=self.create_modern_treasury_account,
        ).grid(column=0, row=1)

    def create_stripe_widgets(self):
        # Widgets for Stripe tab
        ttk.Label(self.stripe_tab, text="Stripe Customer Creation").grid(
            column=0, row=0
        )
        ttk.Button(
            self.stripe_tab, text="Create Customer", command=self.create_stripe_customer
        ).grid(column=0, row=1)

    def create_modern_treasury_account(self):
        # Call the function to create a Modern Treasury account
        create_accounts("modern_treasury", api_key=MODERN_TREASURY_API_KEY)

    def create_stripe_customer(self):
        # Call the function to create a Stripe customer
        create_accounts("stripe", api_key=STRIPE_SECRET_KEY)


if __name__ == "__main__":
    root = tk.Tk()
    app = AccountCreationGUI(root)
    root.mainloop()
