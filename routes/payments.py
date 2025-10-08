
from flask import Blueprint, request, jsonify, render_template, flash, redirect, url_for
from flask_login import login_required, current_user
from services import get_service
import logging

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')
logger = logging.getLogger(__name__)

@payments_bp.route('/process', methods=['POST'])
@login_required
def process_payment():
    """Process a payment through the selected service."""
    try:
        data = request.get_json()
        service_name = data.get('service')
        
        if not service_name:
            return jsonify({'error': 'Service name is required'}), 400
        
        # Get the service
        service = get_service(service_name)
        
        # Process the payment
        result = service.process_payment(data)
        
        if result['success']:
            # Log successful payment
            logger.info(f"Payment processed successfully: {result['payment_id']}")
            
            # TODO: Save transaction to database
            # from models import Transaction
            # transaction = Transaction(...)
            # db.session.add(transaction)
            # db.session.commit()
            
            return jsonify({
                'success': True,
                'payment_id': result['payment_id'],
                'status': result.get('status')
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Payment processing error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@payments_bp.route('/create-customer', methods=['POST'])
@login_required
def create_customer():
    """Create a customer in the payment service."""
    try:
        data = request.get_json()
        service_name = data.get('service')
        
        if not service_name:
            return jsonify({'error': 'Service name is required'}), 400
        
        # Get the service
        service = get_service(service_name)
        
        # Create the customer
        result = service.create_customer(data.get('customer_data', {}))
        
        if result['success']:
            logger.info(f"Customer created successfully: {result['customer_id']}")
            return jsonify({
                'success': True,
                'customer_id': result['customer_id']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Customer creation error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@payments_bp.route('/balance/<service_name>')
@login_required
def get_balance(service_name):
    """Get account balance from service."""
    try:
        service = get_service(service_name)
        account_id = request.args.get('account_id')
        
        result = service.get_balance(account_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Balance retrieval error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@payments_bp.route('/webhook/<service_name>', methods=['POST'])
def webhook_handler(service_name):
    """Handle webhooks from payment services."""
    try:
        payload = request.get_data()
        
        if service_name == 'stripe':
            # Handle Stripe webhook
            # TODO: Implement Stripe webhook verification
            logger.info("Received Stripe webhook")
            
        elif service_name == 'paypal':
            # Handle PayPal webhook
            # TODO: Implement PayPal webhook verification
            logger.info("Received PayPal webhook")
            
        elif service_name == 'modern_treasury':
            # Handle Modern Treasury webhook
            # TODO: Implement MT webhook verification
            logger.info("Received Modern Treasury webhook")
        
        return jsonify({'status': 'success'})
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return jsonify({'error': 'Webhook processing failed'}), 500
