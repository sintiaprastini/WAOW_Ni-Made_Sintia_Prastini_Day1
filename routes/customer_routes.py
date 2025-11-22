from flask import Blueprint, request, jsonify
from models.customer_model import Customer

customer_bp = Blueprint('customer_api', __name__)  

@customer_bp.route('/customers', methods=['GET'])
def get_all_customers():  
    try:
        customers = Customer.get_all()
        return jsonify(customers)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customer_bp.route('/customers', methods=['POST'])
def create_new_customer():  
    try:
        data = request.get_json()
        customer_id = Customer.create(
            data['gender'],
            data['age'],
            data['annual_income'],
            data['spending_score']
        )
        return jsonify({'message': 'Customer created', 'id': customer_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customer_bp.route('/customers/<int:customer_id>', methods=['PUT'])
def update_existing_customer(customer_id):  # 
    try:
        data = request.get_json()
        Customer.update(
            customer_id,
            data['gender'],
            data['age'],
            data['annual_income'],
            data['spending_score']
        )
        return jsonify({'message': 'Customer updated'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customer_bp.route('/customers/<int:customer_id>', methods=['DELETE'])
def delete_customer_by_id(customer_id):  # 
    try:
        Customer.delete(customer_id)
        return jsonify({'message': 'Customer deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500