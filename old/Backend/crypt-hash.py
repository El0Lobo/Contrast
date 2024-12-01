import bcrypt

password = "12345"  # Replace with the desired password
hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
print(hashed_password.decode("utf-8"))
