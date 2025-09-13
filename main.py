import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Import configuration settings
try:
    from configs.settings import DEBUG
except ImportError:
    # Fallback if configs module is not available
    DEBUG = True

# Initialize Flask application
app = Flask(__name__)
app.config['DEBUG'] = DEBUG

# Initialize the database connection
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///payment_processor.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Suppress warning
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Import models to ensure they are known to Flask-Migrate
try:
    from models import *
except ImportError:
    # Models module not yet created - this is expected during initial setup
    pass


@app.route('/')
def home():
    """Home page route for the GOFAP Payment Processor."""
    return 'Welcome to the Government Operations and Financial Accounting Platform (GOFAP)!'


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=DEBUG)



