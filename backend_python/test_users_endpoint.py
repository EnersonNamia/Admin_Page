"""Quick test of the users endpoint after fix"""
import requests

BASE_URL = "http://localhost:5000/api"

print("=" * 80)
print("TESTING USERS ENDPOINT AFTER FIX")
print("=" * 80)

try:
    response = requests.get(f"{BASE_URL}/users")
    print(f"\nStatus: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        users = data.get('users', [])
        print(f"✅ Users loaded successfully! Found {len(users)} users")
        
        if users:
            print(f"\n{'Name':<25} {'Email':<35} {'Tests':<6} {'Status'}")
            print("-" * 75)
            for user in users:
                tests = user.get('tests_taken', 0) or 0
                last_login = user.get('last_login', 'Never')
                print(f"{user['full_name']:<25} {user['email']:<35} {tests:<6} {last_login[:20] if last_login else 'Never'}")
    else:
        print(f"❌ Error: {response.json()}")
        
except Exception as e:
    print(f"❌ Connection error: {e}")
    print("Make sure the backend is running on port 5000")

print("\n" + "=" * 80)
