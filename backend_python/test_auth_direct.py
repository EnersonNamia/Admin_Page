"""Test auth endpoint request directly"""
import requests
import json

BASE_URL = "http://localhost:5000/api"

print("=" * 80)
print("TESTING AUTH ENDPOINT DIRECTLY")
print("=" * 80)

# Test data
email = "namiaenerson939@gmail.com"
password = "Test@123"

print(f"\nSending request:")
print(f"  URL: {BASE_URL}/auth/login")
print(f"  Email: {email}")
print(f"  Password: {password}")

payload = {
    "email": email,
    "password": password
}

print(f"  Payload: {json.dumps(payload)}")

try:
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    print(f"\nResponse:")
    print(f"  Status Code: {response.status_code}")
    print(f"  Headers: {dict(response.headers)}")
    print(f"  Body: {response.text}")
    
    if response.status_code == 200:
        print(f"\n✅ LOGIN SUCCESSFUL!")
        print(f"  Data: {response.json()}")
    else:
        print(f"\n❌ Login failed")
        try:
            print(f"  Error: {response.json()}")
        except:
            print(f"  Error: {response.text}")
            
except Exception as e:
    print(f"❌ Exception: {e}")

print("\n" + "=" * 80)
