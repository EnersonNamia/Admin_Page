import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    host=os.getenv('DB_HOST', 'localhost'),
    database=os.getenv('DB_NAME', 'course_recommendations'),
    user=os.getenv('DB_USER', 'postgres'),
    password=os.getenv('DB_PASSWORD', ''),
    port=os.getenv('DB_PORT', '5432')
)

cur = conn.cursor(cursor_factory=RealDictCursor)
cur.execute('SELECT * FROM recommendation_feedback ORDER BY feedback_id DESC LIMIT 5')
rows = cur.fetchall()

print(f'✅ Total feedback entries: {len(rows)}\n')
for row in rows:
    print(f'  ID: {row["feedback_id"]}, User: {row["user_id"]}, Rating: {row["rating"]}, Text: {row["feedback_text"]}')

cur.close()
conn.close()
