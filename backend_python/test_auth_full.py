"""Test auth login endpoint and verify last_login gets updated"""
import requests
from datetime import datetime, timezone, timedelta
from models.database import execute_query

BASE_URL = "http://localhost:5000/api"

print("=" * 80)
print("TESTING AUTH LOGIN AND LAST_LOGIN UPDATE")
print("=" * 80)

# Get kamansi's current last_login before login
print("\n1. BEFORE LOGIN - Checking kamansi's last_login...")
users_before = execute_query("""
    SELECT user_id, last_login FROM users WHERE email = 'namiaenerson939@gmail.com'
""")
if users_before:
    print(f"   Last login (before): {users_before[0]['last_login']}")

# Try to login via auth endpoint
print("\n2. CALLING AUTH LOGIN ENDPOINT...")
try:
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "namiaenerson939@gmail.com",
        "password": "Test@123"
    })
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Login successful!")
        print(f"   Response: {data}")
    else:
        print(f"   ❌ Login failed: {response.json()}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Check kamansi's last_login AFTER login
print("\n3. AFTER LOGIN - Checking kamansi's last_login...")
import time
time.sleep(1)  # Wait a bit for database to update

users_after = execute_query("""
    SELECT user_id, last_login FROM users WHERE email = 'namiaenerson939@gmail.com'
""")
if users_after:
    last_login = users_after[0]['last_login']
    print(f"   Last login (after): {last_login}")
    
    if last_login:
        now = datetime.now(timezone.utc)
        if last_login.tzinfo is None:
            last_login = last_login.replace(tzinfo=timezone.utc)
        
        diff_seconds = (now - last_login).total_seconds()
        if diff_seconds < 5:
            print(f"   ✅ UPDATED! ({int(diff_seconds)}s ago)")
        else:
            print(f"   ❌ Old timestamp ({int(diff_seconds)}s ago)")
    else:
        print(f"   ❌ Still NULL")

print("\n" + "=" * 80)
