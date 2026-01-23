import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
conn = psycopg2.connect(
    host=os.getenv("DB_HOST", "localhost"),
    database=os.getenv("DB_NAME", "course_recommendations"),
    user=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASSWORD", ""),
    port=os.getenv("DB_PORT", "5432")
)

cur = conn.cursor(cursor_factory=RealDictCursor)

try:
    print("Creating recommendation_feedback table...")
    
    # Create the table if it doesn't exist
    cur.execute("""
        CREATE TABLE IF NOT EXISTS recommendation_feedback (
            feedback_id SERIAL PRIMARY KEY,
            recommendation_id INTEGER,
            user_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            feedback_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (recommendation_id) REFERENCES recommendations(recommendation_id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    print("✅ Table recommendation_feedback created successfully!")
    
    # Verify table exists
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'recommendation_feedback'
    """)
    
    if cur.fetchone():
        print("✅ Table verification successful - recommendation_feedback exists")
        
        # Show table structure
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'recommendation_feedback'
            ORDER BY ordinal_position
        """)
        
        print("\nTable structure:")
        for col in cur.fetchall():
            print(f"  - {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']}, default: {col['column_default']})")
    else:
        print("❌ Table creation failed")

except Exception as error:
    print(f"❌ Error: {error}")
    conn.rollback()
finally:
    cur.close()
    conn.close()
    print("\n✅ Done!")
