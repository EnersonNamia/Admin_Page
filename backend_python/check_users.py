import requests
import json

result = requests.get('http://localhost:5000/api/users?limit=10').json()
users = result.get('users', [])
for u in users:
    print(f'{u["full_name"]}: {u["tests_taken"]} tests')
