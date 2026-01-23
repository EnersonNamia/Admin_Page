"""
Script to create sample recommendations based on test attempts
This simulates what the student app would do after test completion
"""

import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

def add_recommendations():
    """Add sample recommendations to the database"""
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
        
        print("🔄 Creating sample recommendations...")
        
        # Clear existing recommendations
        cursor.execute("DELETE FROM recommendations")
        print("   Cleared existing recommendations")
        
        # Get test attempts to create recommendations for
        cursor.execute("""
            SELECT 
                ta.attempt_id,
                uta.user_id,
                uta.test_id,
                uta.score,
                uta.total_questions,
                uta.attempt_date
            FROM test_attempts ta
            JOIN user_test_attempts uta 
                ON ta.user_id = uta.user_id AND ta.test_id = uta.test_id
            ORDER BY ta.attempt_id
        """)
        
        attempts = cursor.fetchall()
        print(f"   Found {len(attempts)} test attempts to create recommendations for")
        
        # Get courses
        cursor.execute("SELECT course_id, course_name FROM courses LIMIT 5")
        courses = cursor.fetchall()
        
        if not courses:
            print("❌ No courses found")
            return
        
        # Create recommendations for each attempt
        course_idx = 0
        for attempt in attempts:
            attempt_id, user_id, test_id, score, total_questions, taken_at = attempt
            
            # Calculate percentage
            percentage = (score / total_questions * 100) if total_questions > 0 else 0
            
            # Select course based on score and test
            if percentage >= 80:
                # High score - recommend top course
                selected_course = courses[0]
            elif percentage >= 60:
                # Medium score
                selected_course = courses[1 % len(courses)]
            else:
                # Lower score
                selected_course = courses[2 % len(courses)]
            
            reasoning = f"Based on your {percentage:.0f}% score on test {test_id}, we recommend {selected_course[1]}"
            
            # Add recommendation
            cursor.execute("""
                INSERT INTO recommendations 
                (attempt_id, user_id, course_id, reasoning, recommended_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (attempt_id, user_id, selected_course[0], reasoning, taken_at))
            
            print(f"   ✅ Recommendation {attempt_id}: {selected_course[1]} (score: {percentage:.0f}%)")
        
        conn.commit()
        
        # Verify
        cursor.execute("SELECT COUNT(*) FROM recommendations")
        count = cursor.fetchone()[0]
        print(f"\n✅ Successfully created {count} recommendations!")
        
        cursor.close()
        
    except Exception as error:
        print(f"❌ Failed to add recommendations: {error}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    add_recommendations()
