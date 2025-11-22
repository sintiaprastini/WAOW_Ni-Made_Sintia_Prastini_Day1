from database.connection import get_db_connection
from datetime import datetime

class Transaction:
    @staticmethod
    def get_all():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT t.*, c.Gender, c.Age, c.Annual_Income, c.Spending_Score
            FROM transactions t
            JOIN mall_customer c ON t.CustomerID = c.CustomerID
            ORDER BY t.TransactionDate DESC
        """)
        transactions = cursor.fetchall()
        cursor.close()
        conn.close()
        return transactions

    @staticmethod
    def get_by_id(transaction_id):
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT t.*, c.Gender, c.Age, c.Annual_Income, c.Spending_Score
            FROM transactions t
            JOIN mall_customer c ON t.CustomerID = c.CustomerID
            WHERE t.TransactionID = %s
        """, (transaction_id,))
        transaction = cursor.fetchone()
        cursor.close()
        conn.close()
        return transaction

    @staticmethod
    def get_transaction_details(transaction_id):
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT td.*, p.Name as ProductName, p.Price as OriginalPrice
            FROM transaction_details td
            JOIN products p ON td.ProductID = p.ProductID
            WHERE td.TransactionID = %s
        """, (transaction_id,))
        details = cursor.fetchall()
        cursor.close()
        conn.close()
        return details

    @staticmethod
    def create(customer_id, payment_method, items):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Hitung total amount
            total_amount = sum(item['subtotal'] for item in items)
            
            # Insert transaction
            cursor.execute(
                "INSERT INTO transactions (CustomerID, TotalAmount, PaymentMethod) VALUES (%s, %s, %s)",
                (customer_id, total_amount, payment_method)
            )
            transaction_id = cursor.lastrowid
            
            # Insert transaction details dan update stock
            for item in items:
                cursor.execute(
                    "INSERT INTO transaction_details (TransactionID, ProductID, Quantity, UnitPrice, Subtotal) VALUES (%s, %s, %s, %s, %s)",
                    (transaction_id, item['product_id'], item['quantity'], item['unit_price'], item['subtotal'])
                )
                
                # Update product stock
                cursor.execute(
                    "UPDATE products SET Stock = Stock - %s WHERE ProductID = %s",
                    (item['quantity'], item['product_id'])
                )
            
            conn.commit()
            return transaction_id
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_sales_summary():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Total sales
        cursor.execute("SELECT SUM(TotalAmount) as total_sales FROM transactions")
        total_sales = cursor.fetchone()
        
        # Sales by payment method
        cursor.execute("""
            SELECT PaymentMethod, SUM(TotalAmount) as amount, COUNT(*) as count
            FROM transactions 
            GROUP BY PaymentMethod
        """)
        payment_summary = cursor.fetchall()
        
        # Recent transactions
        cursor.execute("""
            SELECT t.TransactionID, t.TransactionDate, t.TotalAmount, c.Gender, c.Age
            FROM transactions t
            JOIN mall_customer c ON t.CustomerID = c.CustomerID
            ORDER BY t.TransactionDate DESC
            LIMIT 5
        """)
        recent_transactions = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            'total_sales': total_sales['total_sales'] or 0,
            'payment_summary': payment_summary,
            'recent_transactions': recent_transactions
        }

    @staticmethod
    def get_customer_transactions(customer_id):
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT t.*, 
                   (SELECT COUNT(*) FROM transaction_details td WHERE td.TransactionID = t.TransactionID) as item_count
            FROM transactions t
            WHERE t.CustomerID = %s
            ORDER BY t.TransactionDate DESC
        """, (customer_id,))
        transactions = cursor.fetchall()
        cursor.close()
        conn.close()
        return transactions