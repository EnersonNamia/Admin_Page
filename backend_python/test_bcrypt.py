"""Debug bcrypt verification"""
from passlib.hash import bcrypt

# Test password
password = "Test@123"
password_truncated = password[:72]

# Hash it
hashed = bcrypt.hash(password_truncated)
print(f"Original password: {password}")
print(f"Truncated password: {password_truncated}")
print(f"Hashed: {hashed}\n")

# Try to verify
print("Testing bcrypt.verify()...")
try:
    result1 = bcrypt.verify(password, hashed)
    print(f"  verify('{password}', hash) = {result1}")
except Exception as e:
    print(f"  verify('{password}', hash) ERROR: {e}")

try:
    result2 = bcrypt.verify(password_truncated, hashed)
    print(f"  verify('{password_truncated}', hash) = {result2}")
except Exception as e:
    print(f"  verify('{password_truncated}', hash) ERROR: {e}")

# Try with a wrong password
try:
    result3 = bcrypt.verify("WrongPassword", hashed)
    print(f"  verify('WrongPassword', hash) = {result3}")
except Exception as e:
    print(f"  verify('WrongPassword', hash) ERROR: {type(e).__name__}: {e}")
