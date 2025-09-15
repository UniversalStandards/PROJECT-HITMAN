"""Database models for GOFAP (Government Operations and Financial Accounting Platform)."""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# This will be initialized in main.py
db = SQLAlchemy()


class User(db.Model):
    """User model for GOFAP system."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.String(50), nullable=False, default="user")
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self) -> str:
        return f"<User {self.username}>"


class Account(db.Model):
    """Account model for financial accounts."""

    __tablename__ = "accounts"

    id = db.Column(db.Integer, primary_key=True)
    account_number = db.Column(db.String(50), unique=True, nullable=False)
    account_name = db.Column(db.String(100), nullable=False)
    account_type = db.Column(db.String(50), nullable=False)  # checking, savings, etc.
    balance = db.Column(db.Numeric(precision=15, scale=2), default=0.00)
    currency = db.Column(db.String(3), default="USD")
    bank_name = db.Column(db.String(100))
    routing_number = db.Column(db.String(20))
    status = db.Column(db.String(20), default="active")
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # External service integration fields
    stripe_customer_id = db.Column(db.String(100))
    modern_treasury_account_id = db.Column(db.String(100))

    user = db.relationship("User", backref=db.backref("accounts", lazy=True))

    def __repr__(self) -> str:
        return f"<Account {self.account_number}>"


class Transaction(db.Model):
    """Transaction model for financial transactions."""

    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.String(100), unique=True, nullable=False)
    amount = db.Column(db.Numeric(precision=15, scale=2), nullable=False)
    currency = db.Column(db.String(3), default="USD")
    transaction_type = db.Column(db.String(50), nullable=False)  # debit, credit
    category = db.Column(db.String(100))
    description = db.Column(db.String(255))
    status = db.Column(db.String(20), default="pending")
    account_id = db.Column(db.Integer, db.ForeignKey("accounts.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime)

    # External service integration fields
    stripe_transaction_id = db.Column(db.String(100))
    modern_treasury_payment_id = db.Column(db.String(100))

    account = db.relationship("Account", backref=db.backref("transactions", lazy=True))

    def __repr__(self) -> str:
        return f"<Transaction {self.transaction_id}>"


class Department(db.Model):
    """Department model for government departments."""

    __tablename__ = "departments"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(10), unique=True, nullable=False)
    description = db.Column(db.Text)
    budget_allocated = db.Column(db.Numeric(precision=15, scale=2), default=0.00)
    budget_spent = db.Column(db.Numeric(precision=15, scale=2), default=0.00)
    head_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    head = db.relationship("User", backref=db.backref("department_head", lazy=True))

    def __repr__(self) -> str:
        return f"<Department {self.name}>"


class Budget(db.Model):
    """Budget model for department budgets."""

    __tablename__ = "budgets"

    id = db.Column(db.Integer, primary_key=True)
    fiscal_year = db.Column(db.Integer, nullable=False)
    department_id = db.Column(
        db.Integer, db.ForeignKey("departments.id"), nullable=False
    )
    category = db.Column(db.String(100), nullable=False)
    allocated_amount = db.Column(db.Numeric(precision=15, scale=2), nullable=False)
    spent_amount = db.Column(db.Numeric(precision=15, scale=2), default=0.00)
    remaining_amount = db.Column(db.Numeric(precision=15, scale=2), default=0.00)
    status = db.Column(db.String(20), default="active")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    department = db.relationship("Department", backref=db.backref("budgets", lazy=True))

    def __repr__(self) -> str:
        return (
            f"<Budget {self.department.name} - {self.category} - FY{self.fiscal_year}>"
        )
