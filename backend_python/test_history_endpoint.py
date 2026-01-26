"""Test script to check test-history endpoint"""
import requests

BASE_URL = "http://localhost:5000/api"

# Test users - try to fetch test history for offline users
test_users = [30, 1, 3]  # user_test_account (30), namia (1), kamansi (3)

print("=" * 80)
print("TESTING TEST-HISTORY ENDPOINT FOR OFFLINE USERS")
print("=" * 80)

for user_id in test_users:
    print(f"\nFetching test history for user_id: {user_id}")
    try:
        response = requests.get(f"{BASE_URL}/users/{user_id}/test-history")
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.json()}")
    except Exception as e:
        print(f"  ❌ Error: {e}")

print("\n" + "=" * 80)
