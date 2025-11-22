from flask import Blueprint, request, jsonify
from models.products_model import Product

product_bp = Blueprint('product_api', __name__) 

@product_bp.route('/products', methods=['GET'])
def get_all_products():  
    try:
        products = Product.get_all()
        return jsonify(products)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products/categories', methods=['GET'])
def get_product_categories(): 
    try:
        categories = Product.get_categories()
        return jsonify(categories)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products', methods=['POST'])
def create_new_product():  
    try:
        data = request.get_json()
        product_id = Product.create(
            data['category_id'],
            data['name'],
            data['price'],
            data['stock']
        )
        return jsonify({'message': 'Product created', 'id': product_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products/<int:product_id>', methods=['PUT'])
def update_existing_product(product_id):  
    try:
        data = request.get_json()
        Product.update(
            product_id,
            data['category_id'],
            data['name'],
            data['price'],
            data['stock']
        )
        return jsonify({'message': 'Product updated'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product_by_id(product_id):  
    try:
        Product.delete(product_id)
        return jsonify({'message': 'Product deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500