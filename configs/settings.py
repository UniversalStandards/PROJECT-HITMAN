import os

DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 'yes')