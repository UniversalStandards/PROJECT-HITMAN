"""Basic tests for GOFAP application."""

import pytest
from main import app, db


@pytest.fixture
def client():
    """Create a test client for the Flask application."""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()


def test_home_page(client):
    """Test that the home page loads successfully."""
    response = client.get('/')
    assert response.status_code == 200
    assert b'Welcome to GOFAP' in response.data


def test_dashboard_page(client):
    """Test that the dashboard page loads successfully."""
    response = client.get('/dashboard')
    assert response.status_code == 200
    assert b'Dashboard' in response.data


def test_accounts_page(client):
    """Test that the accounts page loads successfully."""
    response = client.get('/accounts')
    assert response.status_code == 200
    assert b'Account Management' in response.data


def test_create_account_page(client):
    """Test that the create account page loads successfully."""
    response = client.get('/accounts/create')
    assert response.status_code == 200
    assert b'Create New Account' in response.data


def test_api_create_account_missing_fields(client):
    """Test API account creation with missing fields."""
    response = client.post('/api/accounts/create', 
                          json={}, 
                          content_type='application/json')
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data


def test_api_create_account_valid(client):
    """Test API account creation with valid data."""
    response = client.post('/api/accounts/create', 
                          json={
                              'service': 'stripe',
                              'account_type': 'checking',
                              'account_name': 'Test Account'
                          }, 
                          content_type='application/json')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert 'account_id' in data


def test_transactions_page(client):
    """Test that the transactions page loads successfully."""
    response = client.get('/transactions')
    assert response.status_code == 200
    assert b'Transactions' in response.data


def test_budgets_page(client):
    """Test that the budgets page loads successfully."""
    response = client.get('/budgets')
    assert response.status_code == 200
    assert b'Budget Management' in response.data


def test_reports_page(client):
    """Test that the reports page loads successfully."""
    response = client.get('/reports')
    assert response.status_code == 200
    assert b'Reports' in response.data