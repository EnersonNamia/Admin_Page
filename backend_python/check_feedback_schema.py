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

print("recommendation_feedback table columns:")
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='recommendation_feedback' ORDER BY ordinal_position")
rows = cur.fetchall()
for row in rows:
    print(f'  {row[0]}: {row[1]}')

print("\nSample data:")
cur.execute("SELECT * FROM recommendation_feedback LIMIT 3")
rows = cur.fetchall()
for row in rows:
    print(row)

cur.close()
conn.close()
