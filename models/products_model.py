from database.connection import get_db_connection

class Product:
    @staticmethod
    def get_all():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT p.*, pc.Name as CategoryName 
            FROM products p 
            JOIN product_categories pc ON p.CategoryID = pc.CategoryID
        """)
        products = cursor.fetchall()
        cursor.close()
        conn.close()
        return products

    @staticmethod
    def create(category_id, name, price, stock):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO products (CategoryID, Name, Price, Stock) VALUES (%s, %s, %s, %s)",
            (category_id, name, price, stock)
        )
        conn.commit()
        product_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return product_id

    @staticmethod
    def update(product_id, category_id, name, price, stock):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE products SET CategoryID=%s, Name=%s, Price=%s, Stock=%s WHERE ProductID=%s",
            (category_id, name, price, stock, product_id)
        )
        conn.commit()
        cursor.close()
        conn.close()

    @staticmethod
    def delete(product_id):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM products WHERE ProductID=%s", (product_id,))
        conn.commit()
        cursor.close()
        conn.close()

    @staticmethod
    def get_categories():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM product_categories")
        categories = cursor.fetchall()
        cursor.close()
        conn.close()
        return categories