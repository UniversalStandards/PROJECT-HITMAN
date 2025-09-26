# 🏛️ GOFAP - Government Operations and Financial Accounting Platform

![GOFAP Logo](https://img.shields.io/badge/GOFAP-Government%20Platform-blue?style=for-the-badge)
![Flask](https://img.shields.io/badge/Flask-3.1.2-green?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.12+-blue?style=flat-square)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=flat-square)

The **Government Operations and Financial Accounting Platform (GOFAP)** is a comprehensive, secure, and production-ready financial management system specifically designed for government entities. Built with modern web technologies and following government security standards.

## ✨ Key Features

### 🏦 **Digital Banking & Treasury Management**
- **Account Creation**: Seamlessly create and manage digital bank accounts through Modern Treasury and Stripe integrations
- **Treasury Operations**: Advanced cash flow management, investment optimization, and inter-fund transfers
- **Multi-Currency Support**: Handle transactions in USD, EUR, GBP, CAD, and more

### 💰 **Financial Operations**
- **Payment Processing**: Accept payments, process payroll, handle tax collection and remittances
- **Budget Management**: Department-level budget tracking, allocations, and spending analytics
- **Transaction Management**: Real-time transaction processing with comprehensive audit trails

### 🔒 **Security & Compliance**
- **Role-Based Access Control**: Granular permissions based on user roles and departments
- **Audit Logging**: Complete transaction and activity logging for compliance
- **Bank-Grade Security**: Industry-standard encryption and security protocols

### 📊 **Analytics & Reporting**
- **Financial Analytics**: Comprehensive spending analysis and budget performance
- **Custom Reports**: Generate detailed financial reports for compliance and planning
- **Real-Time Dashboards**: Live financial data visualization and KPIs

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- pip (Python package manager)
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/UniversalStandards/New-Government-agency-banking-Program.git
   cd New-Government-agency-banking-Program
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   # Copy and edit the environment file
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Initialize the database**
   ```bash
   python main.py
   # Database will be created automatically on first run
   ```

5. **Launch the application**
   ```bash
   python main.py
   ```

6. **Access the application**
   - Open your browser to `http://127.0.0.1:5000`
   - Default admin credentials will be displayed in the console

## 🏗️ Architecture

### Technology Stack
- **Backend**: Flask 3.1.2, SQLAlchemy, Flask-Migrate
- **Frontend**: Bootstrap 5, Font Awesome 6, Modern JavaScript
- **Database**: SQLite (development), PostgreSQL (production)
- **Security**: Flask-Login, Werkzeug Security, Cryptography
- **APIs**: Stripe, Modern Treasury, PayPal integration ready

### Project Structure
```
├── main.py                 # Flask application entry point
├── models.py               # Database models
├── configs/                # Configuration files
├── templates/              # HTML templates
├── static/                 # CSS, JavaScript, images
├── modern_treasury/        # Modern Treasury integration
├── stripe/                 # Stripe integration
├── gui/                    # GUI helper functions
└── tests/                  # Test suite
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file with the following variables:

```env
# Flask Configuration
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=sqlite:///gofap.db

# API Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
MODERN_TREASURY_API_KEY=your-mt-api-key
MODERN_TREASURY_ORG_ID=your-org-id

# Security
BCRYPT_LOG_ROUNDS=12
```

### Database Models
- **User**: User authentication and profile management
- **Account**: Financial account management
- **Transaction**: Transaction records and processing
- **Department**: Government department organization
- **Budget**: Budget allocation and tracking

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=.

# Run specific test file
python -m pytest test_main.py -v
```

## 🎨 User Interface

GOFAP features a modern, responsive web interface designed specifically for government use:

- **Professional Government Styling**: Clean, accessible design following government UX standards
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Accessibility**: WCAG 2.1 compliant for government accessibility requirements
- **Modern Components**: Bootstrap 5 with custom government-themed styling

### Main Pages
- **Dashboard**: System overview with key metrics and quick actions
- **Account Management**: Create and manage financial accounts
- **Transactions**: View and process financial transactions
- **Budget Management**: Department budget allocation and tracking
- **Reports & Analytics**: Financial reporting and data visualization

## 🔐 Security Features

- **Multi-Factor Authentication**: Optional MFA for enhanced security
- **Session Management**: Secure session handling with timeout
- **Input Validation**: Comprehensive input sanitization and validation
- **SQL Injection Protection**: Parameterized queries and ORM protection
- **XSS Protection**: Content Security Policy and output encoding
- **CSRF Protection**: Cross-site request forgery protection

## 📈 API Documentation

### Account Creation API
```http
POST /api/accounts/create
Content-Type: application/json

{
  "service": "stripe",
  "account_type": "checking",
  "account_name": "Department Treasury Account",
  "department": "treasury"
}
```

### Response
```json
{
  "success": true,
  "message": "Account created successfully",
  "account_id": "acct_1234567890"
}
```

## 🚀 Deployment

### Production Deployment

1. **Set up production environment**
   ```bash
   pip install gunicorn
   export FLASK_ENV=production
   ```

2. **Configure database**
   ```bash
   # Use PostgreSQL for production
   export DATABASE_URL=postgresql://user:pass@localhost/gofap
   ```

3. **Run with Gunicorn**
   ```bash
   gunicorn -w 4 -b 0.0.0.0:8000 main:app
   ```

### Docker Deployment
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "main:app"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

**Office of Finance, Accounting, and Procurement Services (OFAPS)**

📞 **Phone**: (844) 697-7877 ext 6327  
✉️ **Email**: [gofap@ofaps.spurs.gov](mailto:gofap@ofaps.spurs.gov)  
🌐 **Website**: [gofap.gov](https://gofap.gov)

---

<div align="center">
  <strong>"We Account for Everything"</strong><br>
  <em>Secure, Compliant Financial Management for Government Agencies</em>
</div>