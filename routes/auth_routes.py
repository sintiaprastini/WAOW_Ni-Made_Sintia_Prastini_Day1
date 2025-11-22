from flask import Blueprint, request, session, redirect, flash, url_for, render_template
from models.user_model import UserModel

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/auth')


# ======================
# LOGIN PAGE (GET)
# ======================
@auth_bp.route('/login', methods=['GET'])
def login_form():
    return render_template('login.html')


# ======================
# REGISTER (POST)
# ======================
@auth_bp.route('/register', methods=['POST'])
def register():
    email = request.form.get('email')
    password = request.form.get('password')

    if not email or not password:
        flash("Email dan password harus diisi", "danger")
        return redirect(url_for('auth_bp.login_form'))

    is_exist = UserModel.get_user_by_email(email)
    if is_exist:
        flash("Email sudah terdaftar", "danger")
        return redirect(url_for('auth_bp.login_form'))

    UserModel.create_user(email, password)
    flash("Registrasi berhasil! Silakan login.", "success")
    return redirect(url_for('auth_bp.login_form'))


# ======================
# LOGIN (POST)
# ======================
@auth_bp.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')

    if not email or not password:
        flash("Email dan password harus diisi.", "danger")
        return redirect(url_for('auth_bp.login_form'))

    user = UserModel.get_user_by_email(email)
    if not user:
        print("DEBUG: User tidak ditemukan")
        flash("User tidak ditemukan.", "danger")
        return redirect(url_for('auth_bp.login_form'))

    if not UserModel.validate_password(user["Password"], password):
        print("DEBUG: Password salah")
        flash("Password yang kamu masukkan salah.", "danger")
        return redirect(url_for('auth_bp.login_form'))

    # Login berhasil
    session["user_id"] = user["UserId"]
    session["email"] = user["Email"]

    flash("Login berhasil!", "success")
    return redirect('/dashboard')


# ======================
# LOGOUT (POST)
# ======================
@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    flash("Anda telah logout.", "info")
    return redirect(url_for('auth_bp.login_form'))
