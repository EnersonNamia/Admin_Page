import requests
import json

# Test the feedback submission endpoint
url = "http://localhost:5000/api/feedback/submit"

# Test data
payload = {
    "recommendation_id": 1,
    "user_id": 1,
    "rating": 5,
    "feedback_text": "Test feedback from student"
}

headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
