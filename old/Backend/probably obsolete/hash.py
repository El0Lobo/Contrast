import bcrypt

passwords = ["adminpassword", "password1", "password2"]

for pwd in passwords:
    hashed = bcrypt.hashpw(pwd.encode('utf-8'), bcrypt.gensalt())
    print(f"Password: {pwd}, Hash: {hashed}")
