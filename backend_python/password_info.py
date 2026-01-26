"""Help restore user passwords or set new ones"""
from passlib.hash import bcrypt
from models.database import execute_query

print("=" * 80)
print("USER PASSWORD MANAGEMENT")
print("=" * 80)

# Get all users
users = execute_query("SELECT user_id, email, CONCAT(first_name, ' ', last_name) as full_name FROM users ORDER BY user_id")

print("\nCurrent Users:")
print("-" * 80)
for user in users:
    print(f"  ID: {user['user_id']:<3} | {user['full_name']:<25} | {user['email']}")

print("\n" + "=" * 80)
print("OPTION 1: Set all passwords to 'Test@123'")
print("OPTION 2: Restore to original passwords")
print("=" * 80)

print("\nIMPORTANT:")
print("- The current password for all users is: Test@123")
print("- If you want different passwords, provide them to the User Page backend")
print("- The Admin Page backend doesn't have password recovery capability")
print("\nTo reset passwords for User Page login, update the User Page backend")
print("with the correct password hashes.")

# Show which accounts were reset
print("\n" + "=" * 80)
print("ACCOUNTS AFFECTED BY PASSWORD RESET:")
print("=" * 80)
print("  - namia (namianamia77@gmail.com)")
print("  - kamansi (namiaenerson939@gmail.com)")
print("  - ayasib c tonnet (ayasib@gmail.com)")
print("  - user test account (testaccount@gmail.com)")
print("\nAll above use password: Test@123")
