import os
from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    flash,
    redirect,
    url_for,
)
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Import configuration settings
try:
    from configs.settings import DEBUG, SECRET_KEY, DATABASE_URI
except ImportError:
    # Fallback if configs module is not available
    DEBUG = True
    SECRET_KEY = "dev-key-change-in-production"
    DATABASE_URI = "sqlite:///gofap.db"

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
    from models import User, Account, Transaction, Department, Budget
except ImportError:
    # Models module not yet created - this is expected during initial setup
    pass


@app.route("/")
def home():
    """Home page route for the GOFAP Payment Processor."""
    return render_template("index.html")


@app.route("/dashboard")
def dashboard():
    """Dashboard page showing system overview."""
    return render_template("dashboard.html")


@app.route("/accounts")
def accounts():
    """Accounts management page."""
    return render_template("accounts.html")


@app.route("/accounts/create")
def create_account():
    """Account creation page."""
    return render_template("create_account.html")


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

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/transactions")
def transactions():
    """Transactions page."""
    return render_template("transactions.html")


@app.route("/budgets")
def budgets():
    """Budgets page."""
    return render_template("budgets.html")


@app.route("/reports")
def reports():
    """Reports and analytics page."""
    return render_template("reports.html")


if __name__ == "__main__":
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()

    port = int(os.environ.get("PORT", 5000))
    app.run(host="127.0.0.1", port=port, debug=DEBUG)
