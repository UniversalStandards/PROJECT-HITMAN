"""
Test cases for GOFAP API endpoints.
"""

import pytest
import json
import os
from flask import Flask
from flask_login import LoginManager
from models import (  # noqa: F401
    db,
    User,
    Account,
    # Transaction,
    UserRole,
    AccountType,
    TransactionType,
)


@pytest.fixture
def app():
    """Create test Flask application."""
    app = Flask(__name__)
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    # Fixed: Use environment variable for SECRET_KEY instead of hardcoding
    app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "default-secret-key")

    # Initialize extensions
    db.init_app(app)
    login_manager = LoginManager(app)
    login_manager.login_view = "auth.login"

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Create tables
    with app.app_context():
        db.create_all()

        # Create test data
        admin_user = User(
            username="admin", email="admin@example.com", role=UserRole.ADMIN
        )
        admin_user.set_password("admin123")
        db.session.add(admin_user)

        regular_user = User(
            username="user", email="user@example.com", role=UserRole.USER
        )
        regular_user.set_password("user123")
        db.session.add(regular_user)

        # Create test account
        test_account = Account(
            account_name="Test Account",
            account_type=AccountType.CHECKING,
            balance=1000.00,
            user_id=1,
        )
        db.session.add(test_account)

        db.session.commit()

    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def admin_auth_headers():
    """Get authentication headers for admin user."""
    return {
        "Authorization": "Bearer admin-token",  # In real tests, use proper JWT tokens
        "Content-Type": "application/json",
    }


@pytest.fixture
def user_auth_headers():
    """Get authentication headers for regular user."""
    return {"Authorization": "Bearer user-token", "Content-Type": "application/json"}


class TestUserEndpoints:
    """Test user-related API endpoints."""

    def test_get_users_as_admin(self, client, admin_auth_headers):
        """Test getting all users as admin."""
        response = client.get("/api/users", headers=admin_auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "users" in data
        assert len(data["users"]) >= 2

    def test_get_users_as_regular_user(self, client, user_auth_headers):
        """Test that regular users cannot get all users."""
        response = client.get("/api/users", headers=user_auth_headers)
        assert response.status_code == 403

    def test_create_user(self, client, admin_auth_headers):
        """Test creating a new user."""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "newuser123",
            "role": "USER",
        }
        response = client.post(
            "/api/users", data=json.dumps(user_data), headers=admin_auth_headers
        )
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data["username"] == "newuser"


class TestAccountEndpoints:
    """Test account-related API endpoints."""

    def test_get_accounts(self, client, user_auth_headers):
        """Test getting user accounts."""
        response = client.get("/api/accounts", headers=user_auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "accounts" in data

    def test_create_account(self, client, user_auth_headers):
        """Test creating a new account."""
        account_data = {
            "account_name": "New Savings Account",
            "account_type": "SAVINGS",
            "initial_balance": 500.00,
        }
        response = client.post(
            "/api/accounts", data=json.dumps(account_data), headers=user_auth_headers
        )
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data["account_name"] == "New Savings Account"
        assert data["balance"] == 500.00

    def test_get_account_balance(self, client, user_auth_headers):
        """Test getting account balance."""
        response = client.get("/api/accounts/1/balance", headers=user_auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "balance" in data
        assert data["balance"] == 1000.00


class TestTransactionEndpoints:
    """Test transaction-related API endpoints."""

    def test_create_transaction(self, client, user_auth_headers):
        """Test creating a new transaction."""
        transaction_data = {
            "account_id": 1,
            "amount": 100.00,
            "transaction_type": "DEPOSIT",
            "description": "Test deposit",
        }
        response = client.post(
            "/api/transactions",
            data=json.dumps(transaction_data),
            headers=user_auth_headers,
        )
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data["amount"] == 100.00
        assert data["transaction_type"] == "DEPOSIT"

    def test_get_transactions(self, client, user_auth_headers):
        """Test getting account transactions."""
        response = client.get("/api/accounts/1/transactions", headers=user_auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "transactions" in data


class TestAuthenticationEndpoints:
    """Test authentication endpoints."""

    def test_login_valid_credentials(self, client):
        """Test login with valid credentials."""
        login_data = {"username": "admin", "password": "admin123"}
        response = client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "access_token" in data

    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials."""
        login_data = {"username": "admin", "password": "wrongpassword"}
        response = client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 401

    def test_logout(self, client, user_auth_headers):
        """Test logout functionality."""
        response = client.post("/api/auth/logout", headers=user_auth_headers)
        assert response.status_code == 200


class TestSecurityValidation:
    """Test security-related validations."""

    def test_sql_injection_protection(self, client, user_auth_headers):
        """Test that SQL injection is prevented."""
        malicious_data = {
            "username": "admin'; DROP TABLE users; --",
            "password": "test",
        }
        response = client.post(
            "/api/auth/login",
            data=json.dumps(malicious_data),
            headers={"Content-Type": "application/json"},
        )
        # Should not cause server error or expose database structure
        assert response.status_code in [400, 401]

    def test_xss_prevention(self, client, user_auth_headers):
        """Test XSS prevention in user input."""
        xss_data = {
            "account_name": '<script>alert("xss")</script>',
            "account_type": "CHECKING",
            "initial_balance": 100.00,
        }
        response = client.post(
            "/api/accounts", data=json.dumps(xss_data), headers=user_auth_headers
        )
        # Input should be sanitized
        if response.status_code == 201:
            data = json.loads(response.data)
            # Check that script tags are not present
            assert "<script>" not in data["account_name"]
