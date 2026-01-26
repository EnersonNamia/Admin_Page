"""Test if password in database matches what we think it is"""
from models.database import execute_query
from passlib.hash import bcrypt

# Get the actual hash from database
users = execute_query("""
    SELECT email, password_hash FROM users WHERE email = 'namiaenerson939@gmail.com'
""")

if users:
    user = users[0]
    stored_hash = user['password_hash']
    test_password = "Test@123"
    
    print("=" * 80)
    print("TESTING PASSWORD VERIFICATION")
    print("=" * 80)
    print(f"\nStored hash: {stored_hash}")
    print(f"Test password: {test_password}")
    print(f"Test password (truncated 72): {test_password[:72]}")
    
    # Test verification
    try:
        result1 = bcrypt.verify(test_password, stored_hash)
        print(f"\nbcrypt.verify('{test_password}', hash) = {result1}")
    except Exception as e:
        print(f"\nbcrypt.verify('{test_password}', hash) ERROR: {e}")
    
    try:
        result2 = bcrypt.verify(test_password[:72], stored_hash)
        print(f"bcrypt.verify('{test_password[:72]}', hash) = {result2}")
    except Exception as e:
        print(f"bcrypt.verify('{test_password[:72]}', hash) ERROR: {e}")
    
    print("\n" + "=" * 80)
