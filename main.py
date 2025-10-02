import os
import logging
from flask import (
    Flask,
    request,
    jsonify,
    render_template,
)
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Configure basic logging
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
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-in-production")
    DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///gofap.db")

# Initialize Flask application
app = Flask(__name__)
app.config["DEBUG"] = DEBUG
app.config["SECRET_KEY"] = SECRET_KEY

# Initialize the database connection
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Import models after db initialization
try:
    from models import User, Account, Transaction, Department, Budget  # noqa: F401
except ImportError:
    # Models module not yet created - this is expected during initial setup
    try:
        from models import *
    except ImportError:
        pass

# Register blueprints
try:
    from routes import data_import_bp
    app.register_blueprint(data_import_bp)
    logging.info("Data import routes registered")
except ImportError as e:
    logging.warning(f"Could not register data import routes: {e}")

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
    try:
        return render_template("index.html")
    except:
        return "Welcome to the Government Operations and Financial Accounting Platform (GOFAP)!"


@app.route("/dashboard")
def dashboard():
    """Dashboard page showing system overview."""
    try:
        return render_template("dashboard.html")
    except:
        return jsonify({"message": "GOFAP Dashboard - System Overview"})


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


@app.route('/health')
def health_check():
    """Health check endpoint."""
    return {'status': 'healthy', 'service': 'GOFAP'}


if __name__ == "__main__":
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()

    port = int(os.environ.get("PORT", 5000))
    app.run(host="127.0.0.1", port=port, debug=DEBUG)
