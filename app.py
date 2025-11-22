from flask import Flask, render_template, jsonify, session, redirect
from flask_cors import CORS
from config import Config
from routes.customer_routes import customer_bp
from routes.product_routes import product_bp
from routes.transaction_routes import transaction_bp
from routes.auth_routes import auth_bp

app = Flask(__name__)
app.config.from_object(Config)

# Wajib untuk flash message
# app.secret_key = "ini_secret_key_aman"

# Enable CORS
CORS(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(customer_bp)
app.register_blueprint(product_bp)
app.register_blueprint(transaction_bp)

# Redirect home ke login blueprint (WAJIB)
@app.route('/')
def index_page():
    return redirect('/auth/login')

# Register page (boleh tetap ada)
@app.route('/register')
def register_page():
    return render_template('register.html')

@app.route('/dashboard')
def dashboard_page():
    if "user_id" not in session:
        return redirect('/auth/login')
    return render_template('index.html')

@app.route('/customers')
def customers_page():
    if "user_id" not in session:
        return redirect('/auth/login')
    return render_template('customers.html')

@app.route('/products')
def products_page():
    return render_template('products.html')

@app.route('/transactions')
def transactions_page():
    return render_template('transactions.html')

@app.route('/reports')
def reports_page():
    return render_template('reports.html')

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'message': 'running OK'})

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=5000)
