"""Reset user passwords for testing"""
from passlib.hash import bcrypt
from models.database import execute_query

# Test password - same for all users
test_password = "Test@123"
# Bcrypt has a 72-byte limit, truncate if necessary
password_to_hash = test_password[:72]
hashed_password = bcrypt.hash(password_to_hash)

print("=" * 80)
print("RESETTING PASSWORDS FOR TESTING")
print("=" * 80)
print(f"\nNew password for all users: {test_password}")
print(f"Hashed: {hashed_password}\n")

users_to_update = [
    ("namianamia77@gmail.com", "namia"),
    ("namiaenerson939@gmail.com", "kamansi"),
    ("ayasib@gmail.com", "ayasib"),
    ("testaccount@gmail.com", "user test account")
]

for email, name in users_to_update:
    try:
        result = execute_query(
            "UPDATE users SET password_hash = $1 WHERE email = $2",
            [hashed_password, email],
            fetch=False
        )
        print(f"✅ Updated {name} ({email})")
    except Exception as e:
        print(f"❌ Failed to update {name}: {e}")

print("\n" + "=" * 80)
print(f"All passwords reset to: {test_password}")
print("=" * 80)
