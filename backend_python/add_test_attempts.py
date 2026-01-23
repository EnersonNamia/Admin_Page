"""
Script to manually add test attempt records to the database
This helps sync existing test history from the student app
"""

import psycopg2
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

def add_test_attempt(user_id, test_id, score, total_questions, time_taken=None, attempt_date=None):
    """Add a single test attempt"""
    conn = None
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            database=os.getenv('DB_NAME', 'coursepro_db'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'admin123')
        )
        
        cursor = conn.cursor()
        
        # If no date provided, use current time
        if attempt_date is None:
            attempt_date = datetime.now()
        
        # Insert the test attempt
        cursor.execute("""
            INSERT INTO user_test_attempts (user_id, test_id, score, total_questions, time_taken, attempt_date)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING attempt_id
        """, [user_id, test_id, score, total_questions, time_taken, attempt_date])
        
        attempt_id = cursor.fetchone()[0]
        conn.commit()
        
        print(f"✅ Added test attempt {attempt_id} for user {user_id}")
        return attempt_id
        
    except Exception as error:
        print(f"❌ Error: {error}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

def add_multiple_attempts(attempts_data):
    """
    Add multiple test attempts at once
    attempts_data: list of dicts with keys: user_id, test_id, score, total_questions, time_taken (optional), attempt_date (optional)
    """
    for attempt in attempts_data:
        add_test_attempt(
            user_id=attempt['user_id'],
            test_id=attempt['test_id'],
            score=attempt['score'],
            total_questions=attempt['total_questions'],
            time_taken=attempt.get('time_taken'),
            attempt_date=attempt.get('attempt_date')
        )

if __name__ == "__main__":
    print("📝 Test Attempt Data Migration Tool")
    print("=====================================\n")
    
    # Example: Add test attempts
    # Uncomment and modify the following to add your test data
    
    test_attempts = [
        # {
        #     'user_id': 1,
        #     'test_id': 1,
        #     'score': 8,
        #     'total_questions': 10,
        #     'time_taken': 15,
        #     'attempt_date': datetime.now() - timedelta(days=1)
        # },
        # {
        #     'user_id': 1,
        #     'test_id': 1,
        #     'score': 9,
        #     'total_questions': 10,
        #     'time_taken': 13,
        #     'attempt_date': datetime.now()
        # }
    ]
    
    print("Usage:")
    print("------")
    print("1. Open this file and uncomment the example test attempts")
    print("2. Modify the data to match your test history")
    print("3. Run the script\n")
    print("Available fields per attempt:")
    print("  - user_id (required): ID of the user who took the test")
    print("  - test_id (required): ID of the test")
    print("  - score (required): Score achieved")
    print("  - total_questions (required): Total questions in the test")
    print("  - time_taken (optional): Time in minutes")
    print("  - attempt_date (optional): DateTime of the attempt (defaults to now)\n")
    
    if test_attempts:
        print(f"Adding {len(test_attempts)} test attempts...\n")
        add_multiple_attempts(test_attempts)
        print("\n✅ All test attempts added successfully!")
    else:
        print("No test attempts configured. Add data and run again.")
