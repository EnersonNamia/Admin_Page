"""Test auth endpoint with debugging"""
import requests
import json

BASE_URL = "http://localhost:5000/api"

print("=" * 80)
print("TESTING AUTH ENDPOINT DIRECTLY")
print("=" * 80)

# First, check if the endpoint exists by calling it with bad credentials
print("\nChecking if /api/auth/login endpoint exists...")
try:
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "test@test.com",
        "password": "test123"
    })
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 404:
        print("❌ ENDPOINT NOT FOUND - Backend hasn't restarted with auth route!")
    elif response.status_code in [401, 400]:
        print("✅ Endpoint exists and is responding")
    
except requests.exceptions.ConnectionError as e:
    print(f"❌ Cannot connect to backend: {e}")
    print("   Make sure the backend is running on http://localhost:5000")

print("\n" + "=" * 80)
