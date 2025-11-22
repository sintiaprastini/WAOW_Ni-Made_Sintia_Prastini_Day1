from database.connection import get_db_connection

class Customer:
    @staticmethod
    def get_all():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM mall_customer")
        customers = cursor.fetchall()
        cursor.close()
        conn.close()
        return customers

    @staticmethod
    def create(gender, age, annual_income, spending_score):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO mall_customer (Gender, Age, Annual_Income, Spending_Score) VALUES (%s, %s, %s, %s)",
            (gender, age, annual_income, spending_score)
        )
        conn.commit()
        customer_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return customer_id

    @staticmethod
    def update(customer_id, gender, age, annual_income, spending_score):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE mall_customer SET Gender=%s, Age=%s, Annual_Income=%s, Spending_Score=%s WHERE CustomerID=%s",
            (gender, age, annual_income, spending_score, customer_id)
        )
        conn.commit()
        cursor.close()
        conn.close()

    @staticmethod
    def delete(customer_id):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM mall_customer WHERE CustomerID=%s", (customer_id,))
        conn.commit()
        cursor.close()
        conn.close()