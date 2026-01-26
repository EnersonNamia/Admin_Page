"""Check if user exists in database"""
from models.database import execute_query_one

email = "namiaenerson939@gmail.com"

print(f"Querying for user with email: {email}\n")

# Try exact match
user = execute_query_one("""
    SELECT 
        user_id,
        email,
        password_hash,
        is_active
    FROM users WHERE email = %s
""", [email])

if user:
    print("✅ User found!")
    print(f"  User ID: {user['user_id']}")
    print(f"  Email: {user['email']}")
    print(f"  Email matches: {user['email'] == email}")
    print(f"  Password hash: {user['password_hash'][:20]}...")
    print(f"  Is active: {user['is_active']}")
else:
    print("❌ User NOT found")

# List all users
print("\n" + "=" * 80)
print("ALL USERS IN DATABASE:")
print("=" * 80)

all_users = execute_query_one("""
    SELECT COUNT(*) as count FROM users
""")

users_list = execute_query_one("""
    SELECT user_id, email FROM users LIMIT 10
""")

if users_list:
    print(users_list)
