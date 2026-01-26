"""Debug what's in the database"""
from models.database import execute_query
from passlib.hash import bcrypt

print("=" * 80)
print("DEBUGGING DATABASE STATE")
print("=" * 80)

# Get one user's data
users = execute_query("""
    SELECT 
        user_id,
        email,
        CONCAT(first_name, ' ', last_name) as full_name,
        password_hash
    FROM users
    WHERE email = 'namiaenerson939@gmail.com'
    LIMIT 1
""")

if users:
    user = users[0]
    print(f"\nUser in database: {user['full_name']} ({user['email']})")
    print(f"Password hash: {user['password_hash']}")
    print(f"Hash length: {len(user['password_hash']) if user['password_hash'] else 'NULL'}")
    
    # Test verification with the stored hash
    test_password = "Test@123"
    print(f"\nTesting password: '{test_password}'")
    try:
        result = bcrypt.verify(test_password, user['password_hash'])
        print(f"✅ Password verification: {result}")
    except Exception as e:
        print(f"❌ Password verification error: {e}")

print("\n" + "=" * 80)
