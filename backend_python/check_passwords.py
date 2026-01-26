"""Check password hashes in database"""
from models.database import execute_query

print("=" * 80)
print("CHECKING PASSWORD HASHES IN DATABASE")
print("=" * 80)

users = execute_query("""
    SELECT 
        user_id,
        CONCAT(first_name, ' ', last_name) as full_name,
        email,
        password_hash
    FROM users
    ORDER BY user_id
""")

if users:
    for user in users:
        hash_val = user['password_hash']
        print(f"\nUser: {user['full_name']} ({user['email']})")
        if hash_val:
            print(f"  Hash Length: {len(hash_val)}")
            print(f"  Hash Type: {hash_val[:7] if len(hash_val) >= 7 else 'unknown'}")
            print(f"  Hash: {hash_val[:50]}...")
        else:
            print(f"  Hash: NULL/EMPTY")

print("\n" + "=" * 80)
