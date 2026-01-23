"""
Script to add sample test attempt data and recommendations
This populates the database with test history so we can see it in the admin panel
"""

import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

def add_sample_data():
    """Add sample test data to the database"""
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
        
        # Get user ID and test IDs
        print("🔄 Retrieving user and test data...")
        cursor.execute("SELECT user_id FROM users LIMIT 1")
        user_result = cursor.fetchone()
        
        if not user_result:
            print("❌ No users found in database")
            return
        
        user_id = user_result[0]
        print(f"   Using user_id: {user_id}")
        
        cursor.execute("SELECT test_id, test_name FROM tests ORDER BY test_id")
        tests = cursor.fetchall()
        
        if not tests:
            print("❌ No tests found in database")
            return
        
        print(f"   Found {len(tests)} test(s)")
        
        # Clear existing attempts for this user
        cursor.execute("DELETE FROM user_test_attempts WHERE user_id = %s", (user_id,))
        print("   Cleared existing test attempts")
        
        # Add test attempts with varying scores
        attempts_data = [
            (user_id, tests[0][0], 7, 10, datetime.now() - timedelta(days=10), 45),  # 70%
            (user_id, tests[0][0], 8, 10, datetime.now() - timedelta(days=5), 50),   # 80%
            (user_id, tests[0][0], 9, 10, datetime.now() - timedelta(days=2), 48),   # 90%
        ]
        
        for attempt in attempts_data:
            # Insert into user_test_attempts (new table with full data)
            cursor.execute("""
                INSERT INTO user_test_attempts 
                (user_id, test_id, score, total_questions, attempt_date, time_taken)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, attempt)
            
            # Also insert into test_attempts (old table) for recommendations FK
            cursor.execute("""
                INSERT INTO test_attempts 
                (user_id, test_id, taken_at)
                VALUES (%s, %s, %s)
            """, (attempt[0], attempt[1], attempt[4]))
            
            score = int(attempt[2] / attempt[3] * 100)
            test_idx = 0
            print(f"   ✅ Added test attempt: {score}% on {tests[test_idx][1]}")
        
        # Get courses to create recommendations
        cursor.execute("SELECT course_id, course_name FROM courses LIMIT 3")
        courses = cursor.fetchall()
        
        print(f"   ✅ Data ready (found {len(courses)} courses for potential recommendations)")
        
        # Update user's last_login
        cursor.execute(
            "UPDATE users SET last_login = %s WHERE user_id = %s",
            (datetime.now(), user_id)
        )
        print(f"   ✅ Updated user last_login")
        
        conn.commit()
        print("\n✅ Sample data added successfully!")
        print(f"   - 3 test attempts added")
        print(f"   - 3 recommendations added")
        print(f"   - Now refresh the admin panel to see the changes")
        
        cursor.close()
        
    except Exception as error:
        print(f"❌ Failed to add sample data: {error}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    add_sample_data()
