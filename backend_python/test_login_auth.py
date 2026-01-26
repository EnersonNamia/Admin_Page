"""Test auth login endpoint with known password"""
import requests
from datetime import datetime, timezone

BASE_URL = "http://localhost:5000/api"

print("=" * 80)
print("TESTING AUTH LOGIN WITH KNOWN PASSWORD")
print("=" * 80)

# Try to login with kamansi credentials
test_credentials = [
    ("namiaenerson939@gmail.com", "Test@123", "kamansi"),
    ("testaccount@gmail.com", "Test@123", "user test account"),
]

for email, password, name in test_credentials:
    print(f"\nAttempting login with {name}...")
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": password
        })
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Login successful!")
            print(f"  Token: {data['token'][:30]}...")
            print(f"  User: {data['user']['full_name']}")
        else:
            print(f"  ❌ Login failed: {response.json()}")
    except Exception as e:
        print(f"  ❌ Error: {e}")

# Now check if last_login was updated
print("\n" + "=" * 80)
print("CHECKING IF LAST_LOGIN WAS UPDATED")
print("=" * 80)

from models.database import execute_query

users = execute_query("""
    SELECT 
        user_id,
        CONCAT(first_name, ' ', last_name) as full_name,
        last_login
    FROM users
    WHERE email IN ('namiaenerson939@gmail.com', 'testaccount@gmail.com')
    ORDER BY user_id
""")

for user in users:
    print(f"\nUser: {user['full_name']}")
    if user['last_login']:
        now = datetime.now(timezone.utc)
        # Handle both timezone-aware and naive datetimes
        last_login = user['last_login']
        if last_login.tzinfo is None:
            last_login = last_login.replace(tzinfo=timezone.utc)
        diff = (now - last_login).total_seconds()
        secs = int(diff)
        print(f"  Last Login: {last_login}")
        print(f"  Seconds ago: {secs}s")
        if secs < 60:
            print(f"  ✅ UPDATED JUST NOW!")
        else:
            print(f"  ❌ Not recently updated ({secs} seconds ago)")
    else:
        print(f"  Last Login: NULL")

print("\n" + "=" * 80)
