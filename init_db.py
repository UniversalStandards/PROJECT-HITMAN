
"""Database initialization script for GOFAP."""

import os
from main import app, db
from models import User, Department, Account, Budget
from werkzeug.security import generate_password_hash

def init_database():
    """Initialize the database with sample data."""
    with app.app_context():
        # Create all tables
        db.create_all()
        print("✅ Database tables created successfully!")
        
        # Check if we already have data
        if User.query.first():
            print("📊 Database already contains data. Skipping initialization.")
            return
        
        # Create default departments
        departments = [
            Department(name="Treasury", code="TREAS", description="Treasury and Financial Management"),
            Department(name="Operations", code="OPS", description="General Operations"),
            Department(name="Human Resources", code="HR", description="Human Resources Management"),
            Department(name="Information Technology", code="IT", description="Technology and Systems"),
            Department(name="Procurement", code="PROC", description="Procurement and Contracts")
        ]
        
        for dept in departments:
            db.session.add(dept)
        
        db.session.commit()
        print("🏢 Default departments created!")
        
        # Create admin user
        admin_user = User(
            username="admin",
            email="admin@gofap.gov",
            first_name="System",
            last_name="Administrator",
            role="admin",
            department_id=1  # Treasury
        )
        admin_user.set_password("admin123!")
        db.session.add(admin_user)
        
        # Create demo user
        demo_user = User(
            username="demo",
            email="demo@gofap.gov",
            first_name="Demo",
            last_name="User",
            role="user",
            department_id=2  # Operations
        )
        demo_user.set_password("demo123!")
        db.session.add(demo_user)
        
        db.session.commit()
        print("👤 Default users created!")
        
        # Create sample accounts
        treasury_account = Account(
            account_name="Main Treasury Account",
            account_type="checking",
            balance=100000.00,
            currency="USD",
            bank_name="Federal Reserve Bank",
            user_id=1,
            department_id=1
        )
        
        operations_account = Account(
            account_name="Operations Account",
            account_type="checking",
            balance=25000.00,
            currency="USD",
            bank_name="Community Bank",
            user_id=2,
            department_id=2
        )
        
        db.session.add(treasury_account)
        db.session.add(operations_account)
        db.session.commit()
        print("🏦 Sample accounts created!")
        
        # Create sample budgets
        budgets = [
            Budget(
                fiscal_year=2024,
                department_id=1,
                category="Operations",
                allocated_amount=500000.00,
                spent_amount=125000.00
            ),
            Budget(
                fiscal_year=2024,
                department_id=2,
                category="Equipment",
                allocated_amount=100000.00,
                spent_amount=35000.00
            ),
            Budget(
                fiscal_year=2024,
                department_id=3,
                category="Personnel",
                allocated_amount=750000.00,
                spent_amount=400000.00
            )
        ]
        
        for budget in budgets:
            db.session.add(budget)
        
        db.session.commit()
        print("💰 Sample budgets created!")
        
        print("\n🎉 Database initialization complete!")
        print("\n📋 Default Login Credentials:")
        print("   Admin User:")
        print("     Username: admin")
        print("     Password: admin123!")
        print("   Demo User:")
        print("     Username: demo")
        print("     Password: demo123!")
        print("\n🔒 Please change these passwords immediately in production!")

if __name__ == "__main__":
    init_database()
