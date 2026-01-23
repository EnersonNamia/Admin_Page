"""
Database migration script to add user activity tracking columns
Run this once to update your existing database schema
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def run_migrations():
    """Run database migrations"""
    conn = None
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            database=os.getenv('DB_NAME', 'coursepro_db'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'admin123')
        )
        
        cursor = conn.cursor()
        
        # Migration 1: Add is_active column if it doesn't exist
        print("🔄 Checking for is_active column...")
        cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='users' AND column_name='is_active'
        """)
        
        if not cursor.fetchone():
            print("   Adding is_active column...")
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN is_active BOOLEAN DEFAULT TRUE
            """)
            print("   ✅ is_active column added")
        else:
            print("   ✅ is_active column already exists")
        
        # Migration 2: Add last_login column if it doesn't exist
        print("🔄 Checking for last_login column...")
        cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='users' AND column_name='last_login'
        """)
        
        if not cursor.fetchone():
            print("   Adding last_login column...")
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN last_login TIMESTAMP WITH TIME ZONE
            """)
            print("   ✅ last_login column added")
        else:
            print("   ✅ last_login column already exists")
        
        # Migration 3: Check if user_test_attempts table exists
        print("🔄 Checking for user_test_attempts table...")
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'user_test_attempts'
            )
        """)
        
        if not cursor.fetchone()[0]:
            print("   Creating user_test_attempts table...")
            cursor.execute("""
                CREATE TABLE user_test_attempts (
                    attempt_id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                    test_id INTEGER NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
                    score INTEGER NOT NULL,
                    total_questions INTEGER NOT NULL,
                    attempt_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    time_taken INTEGER,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("   ✅ user_test_attempts table created")
        else:
            print("   ✅ user_test_attempts table already exists")
        
        conn.commit()
        print("\n✅ All migrations completed successfully!")
        
        cursor.close()
        
    except Exception as error:
        print(f"❌ Migration failed: {error}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("🚀 Starting database migrations...")
    print(f"   Database: {os.getenv('DB_NAME', 'coursepro_db')}")
    print(f"   Host: {os.getenv('DB_HOST', 'localhost')}\n")
    run_migrations()
