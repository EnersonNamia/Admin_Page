"""Test script to check auth login endpoint"""
import requests
from datetime import datetime

BASE_URL = "http://localhost:5000/api"

print("=" * 80)
print("TESTING AUTH LOGIN ENDPOINT")
print("=" * 80)

# Try to login with kamansi credentials
print("\nAttempting login with kamansi account...")
try:
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "namiaenerson939@gmail.com",
        "password": "your_password_here"  # This will likely fail but let's see the error
    })
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

# Check current last_login in database
print("\n" + "=" * 80)
print("CHECKING CURRENT LAST_LOGIN IN DATABASE")
print("=" * 80)

from models.database import execute_query

users = execute_query("""
    SELECT 
        user_id,
        CONCAT(first_name, ' ', last_name) as full_name,
        email,
        last_login
    FROM users
    ORDER BY user_id
""")

if users:
    for user in users:
        print(f"\nUser: {user['full_name']} ({user['email']})")
        print(f"  Last Login: {user['last_login']}")
        if user['last_login']:
            now = datetime.now(user['last_login'].tzinfo)
            diff = (now - user['last_login']).total_seconds()
            mins = int(diff / 60)
            hours = int(diff / 3600)
            days = int(diff / 86400)
            if days > 0:
                print(f"  Time Ago: {days}d ago")
            elif hours > 0:
                print(f"  Time Ago: {hours}h ago")
            else:
                print(f"  Time Ago: {mins}m ago")

print("\n" + "=" * 80)
