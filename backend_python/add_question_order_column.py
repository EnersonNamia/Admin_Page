"""
Database migration script to add question_order column to questions table
Run this to update your existing database schema
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Run database migration"""
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
        
        # Check if question_order column exists
        print("🔄 Checking for question_order column...")
        cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='questions' AND column_name='question_order'
        """)
        
        if not cursor.fetchone():
            print("   Adding question_order column...")
            cursor.execute("""
                ALTER TABLE questions 
                ADD COLUMN question_order INTEGER DEFAULT 1
            """)
            print("   ✅ question_order column added")
        else:
            print("   ✅ question_order column already exists")
        
        # Check if question_type column exists
        print("🔄 Checking for question_type column...")
        cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='questions' AND column_name='question_type'
        """)
        
        if not cursor.fetchone():
            print("   Adding question_type column...")
            cursor.execute("""
                ALTER TABLE questions 
                ADD COLUMN question_type VARCHAR(50) DEFAULT 'multiple_choice'
            """)
            print("   ✅ question_type column added")
        else:
            print("   ✅ question_type column already exists")
        
        # Check if created_at column exists
        print("🔄 Checking for created_at column...")
        cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='questions' AND column_name='created_at'
        """)
        
        if not cursor.fetchone():
            print("   Adding created_at column...")
            cursor.execute("""
                ALTER TABLE questions 
                ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            """)
            print("   ✅ created_at column added")
        else:
            print("   ✅ created_at column already exists")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
        cursor.close()
        
    except Exception as error:
        print(f"❌ Migration failed: {error}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    run_migration()
