# GOFAP - Government Operations and Financial Accounting Platform
# Production-ready Docker configuration

FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=main.py
ENV FLASK_ENV=production

# Set work directory
WORKDIR /app

# Install system dependencies with pinned versions
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client=13+225 \
        gcc=4:10.2.1-1 \
        libpq-dev=13.14-0+deb11u1 \
        curl=7.74.0-1.3+deb11u13 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r gofap && useradd -r -g gofap gofap

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/instance /app/logs \
    && chown -R gofap:gofap /app

# Switch to non-root user
USER gofap

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1

# Run application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "main:app"]