from database.connection import get_db_connection
from werkzeug.security import generate_password_hash, check_password_hash

class UserModel:

    @staticmethod
    def create_user(email, password):
        conn = get_db_connection()
        cursor = conn.cursor()

        hashed_pw = generate_password_hash(password)

        query = """
            INSERT INTO users (Email, Password, IsActive)
            VALUES (%s, %s, 1)
        """
        cursor.execute(query, (email, hashed_pw))
        conn.commit()

        cursor.close()
        conn.close()
        return True

    @staticmethod
    def get_user_by_email(email):
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM users WHERE Email = %s", (email,))
        result = cursor.fetchone()

        cursor.close()
        conn.close()
        return result

    @staticmethod
    def validate_password(hashed_password, password):
        return check_password_hash(hashed_password, password)
