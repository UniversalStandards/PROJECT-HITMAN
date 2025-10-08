import os
import logging
from datetime import datetime
from flask import (
    Flask,
    request,
    jsonify,
    render_template,
    flash,
    redirect,
    url_for
)
from flask_migrate import Migrate
from flask_login import LoginManager, login_required, current_user
from models import db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Import configuration settings
try:
    from configs.settings import DEBUG, SECRET_KEY, DATABASE_URI
except ImportError:
    # Fallback if configs module is not available
    DEBUG = os.environ.get("FLASK_DEBUG", "True").lower() in ("true", "1", "yes", "on")
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-in-production-2024")
    DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///gofap.db")

# Initialize Flask application
app = Flask(__name__)
app.config["DEBUG"] = DEBUG
app.config["SECRET_KEY"] = SECRET_KEY

# Initialize the database connection
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)
migrate = Migrate(app, db)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'info'

# Import models after db initialization
try:
    from models import User, Account, Transaction, Department, Budget  # noqa: F401
except ImportError:
    # Models module not yet created - this is expected during initial setup
    try:
        from models import *
    except ImportError:
        pass

# Flask-Login user loader
@login_manager.user_loader
def load_user(user_id):
    from models import User
    return User.query.get(int(user_id))

# Register authentication blueprint
try:
    from auth import auth_bp
    app.register_blueprint(auth_bp)
    logging.info("Authentication routes registered")
except ImportError as e:
    logging.warning(f"Could not register authentication routes: {e}")

# Template context processor
@app.context_processor
def inject_current_year():
    return {'current_year': datetime.now().year}

# Register blueprints
try:
    from routes import data_import_bp
    app.register_blueprint(data_import_bp)
    logging.info("Data import routes registered")
except ImportError as e:
    logging.warning(f"Could not register data import routes: {e}")

# Register payment routes
try:
    from routes.payments import payments_bp
    app.register_blueprint(payments_bp)
    logging.info("Payment routes registered")
except ImportError as e:
    logging.warning(f"Could not register payment routes: {e}")

# Register CLI commands
try:
    from cli import register_data_import_commands
    register_data_import_commands(app)
    logging.info("Data import CLI commands registered")
except ImportError as e:
    logging.warning(f"Could not register data import CLI commands: {e}")


@app.route("/")
def home():
    """Home page route for the GOFAP Payment Processor."""
    return render_template("index.html")


@app.route("/dashboard")
@login_required
def dashboard():
    """Dashboard page showing system overview."""
    try:
        from models import Account, Transaction, Budget
        
        # Get user's accounts
        user_accounts = Account.query.filter_by(user_id=current_user.id).all()
        total_balance = sum(acc.balance for acc in user_accounts)
        
        # Get recent transactions
        recent_transactions = Transaction.query.join(Account).filter(
            Account.user_id == current_user.id
        ).order_by(Transaction.created_at.desc()).limit(10).all()
        
        # Get budget information
        user_budgets = Budget.query.join(Department).join(Account).filter(
            Account.user_id == current_user.id
        ).all()
        
        return render_template("dashboard.html", 
                             accounts=user_accounts,
                             total_balance=total_balance,
                             recent_transactions=recent_transactions,
                             budgets=user_budgets)
    except Exception as e:
        logging.error(f"Dashboard error: {e}")
        flash("Error loading dashboard data", "error")
        return render_template("dashboard.html")


@app.route("/accounts")
def accounts():
    """Accounts management page."""
    try:
        return render_template("accounts.html")
    except:
        return jsonify({"message": "GOFAP Account Management"})


@app.route("/accounts/create")
def create_account():
    """Account creation page."""
    try:
        return render_template("create_account.html")
    except:
        return jsonify({"message": "GOFAP Account Creation"})


@app.route("/api/accounts/create", methods=["POST"])
def api_create_account():
    """API endpoint for creating accounts."""
    try:
        data = request.get_json()
        service = data.get("service")
        account_type = data.get("account_type")
        account_name = data.get("account_name")

        if not all([service, account_type, account_name]):
            return jsonify({"error": "Missing required fields"}), 400

        # Here you would integrate with the actual service APIs
        # For now, return a success response
        return jsonify(
            {
                "success": True,
                "message": f"{service} account created successfully",
                "account_id": f"mock_{service}_{account_type}_account",
            }
        )

    except Exception:
        logging.exception("Exception occurred while creating account")
        return (
            jsonify({"error": "An internal error occurred. Please try again later."}),
            500,
        )


@app.route("/transactions")
def transactions():
    """Transactions page."""
    try:
        return render_template("transactions.html")
    except:
        return jsonify({"message": "GOFAP Transaction Management"})


@app.route("/budgets")
def budgets():
    """Budgets page."""
    try:
        return render_template("budgets.html")
    except:
        return jsonify({"message": "GOFAP Budget Management"})


@app.route("/reports")
def reports():
    """Reports and analytics page."""
    try:
        return render_template("reports.html")
    except:
        return jsonify({"message": "GOFAP Reports and Analytics"})


@app.route("/payments")
@login_required
def payments():
    """Payment processing page."""
    try:
        return render_template("payments.html")
    except:
        return jsonify({"message": "GOFAP Payment Processing"})


@app.route('/health')
def health_check():
    """Health check endpoint."""
    return {'status': 'healthy', 'service': 'GOFAP'}


if __name__ == "__main__":
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()

    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=DEBUG)
