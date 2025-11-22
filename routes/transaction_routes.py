from flask import Blueprint, request, jsonify
from models.transaction_model import Transaction

transaction_bp = Blueprint('transactions', __name__)

@transaction_bp.route('/api/transactions', methods=['GET'])
def get_transactions():
    try:
        transactions = Transaction.get_all()
        return jsonify(transactions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transaction_bp.route('/api/transactions/<int:transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    try:
        transaction = Transaction.get_by_id(transaction_id)
        if transaction:
            details = Transaction.get_transaction_details(transaction_id)
            transaction['details'] = details
            return jsonify(transaction)
        else:
            return jsonify({'error': 'Transaction not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transaction_bp.route('/api/transactions', methods=['POST'])
def create_transaction():
    try:
        data = request.get_json()
        
        # Validasi data
        if not all(key in data for key in ['customer_id', 'payment_method', 'items']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if not data['items']:
            return jsonify({'error': 'Transaction must have at least one item'}), 400
        
        # Validasi setiap item
        for item in data['items']:
            if not all(key in item for key in ['product_id', 'quantity', 'unit_price', 'subtotal']):
                return jsonify({'error': 'Invalid item structure'}), 400
        
        transaction_id = Transaction.create(
            data['customer_id'],
            data['payment_method'],
            data['items']
        )
        
        return jsonify({
            'message': 'Transaction created successfully',
            'transaction_id': transaction_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transaction_bp.route('/api/transactions/summary', methods=['GET'])
def get_sales_summary():
    try:
        summary = Transaction.get_sales_summary()
        return jsonify(summary)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transaction_bp.route('/api/customers/<int:customer_id>/transactions', methods=['GET'])
def get_customer_transactions(customer_id):
    try:
        transactions = Transaction.get_customer_transactions(customer_id)
        return jsonify(transactions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transaction_bp.route('/api/transactions/<int:transaction_id>/details', methods=['GET'])
def get_transaction_details(transaction_id):
    try:
        details = Transaction.get_transaction_details(transaction_id)
        return jsonify(details)
    except Exception as e:
        return jsonify({'error': str(e)}), 500