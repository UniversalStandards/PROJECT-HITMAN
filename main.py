import os
from flask import Flask

# Try to import settings, fallback to default if not available
try:
    from configs.settings import DEBUG
except ImportError:
    DEBUG = True

app = Flask(__name__)
app.config['DEBUG'] = DEBUG

@app.route('/')
def home():
    return 'Welcome to the Payment Processor App!'

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=DEBUG)



