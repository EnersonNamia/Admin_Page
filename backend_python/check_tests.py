import requests

result = requests.get('http://localhost:5000/api/tests?limit=10').json()
tests = result.get('tests', [])
print(f'Tests found: {len(tests)}')
print(f'Total tests in DB: {result.get("pagination", {}).get("total", 0)}')
for t in tests[:5]:
    print(f'{t.get("test_id")}: {t.get("test_name")}')
