import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT'),
    database=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD')
)
cur = conn.cursor()

print("User test attempts:")
cur.execute('SELECT COUNT(*) FROM user_test_attempts')
count = cur.fetchone()[0]
print(f'Count: {count}')

cur.execute('SELECT * FROM user_test_attempts LIMIT 3')
rows = cur.fetchall()
for row in rows:
    print(row)

print("\nTest attempts:")
cur.execute('SELECT COUNT(*) FROM test_attempts')
count = cur.fetchone()[0]
print(f'Count: {count}')

cur.close()
conn.close()
