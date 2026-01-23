"""
Comprehensive script to populate and maintain persistent test data
Run this once to populate the database with test attempts and recommendations
"""

import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

def populate_persistent_data():
    """Populate database with persistent test data"""
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
        
        print("=" * 60)
        print("PERSISTENT DATA POPULATION SCRIPT")
        print("=" * 60)
        
        # Check existing data
        cursor.execute("SELECT COUNT(*) FROM user_test_attempts")
        attempt_count = cursor.fetchone()[0]
        
        if attempt_count > 0:
            print(f"\n✅ Database already has {attempt_count} test attempts")
            print("   No action needed - data is persistent")
            cursor.close()
            conn.close()
            return
        
        print("\n🔄 Populating database with test data...\n")
        
        # Get users
        cursor.execute("SELECT user_id, CONCAT(first_name, ' ', last_name) as full_name FROM users LIMIT 5")
        users = cursor.fetchall()
        
        if not users:
            print("❌ No users found. Please create users first.")
            cursor.close()
            conn.close()
            return
        
        print(f"Found {len(users)} user(s):")
        for user_id, full_name in users:
            print(f"  - {user_id}: {full_name}")
        
        # Get tests
        cursor.execute("SELECT test_id, test_name FROM tests LIMIT 5")
        tests = cursor.fetchall()
        
        if not tests:
            print("\n❌ No tests found. Please create tests first.")
            cursor.close()
            conn.close()
            return
        
        print(f"\nFound {len(tests)} test(s):")
        for test_id, test_name in tests:
            print(f"  - {test_id}: {test_name}")
        
        # Get courses
        cursor.execute("SELECT course_id, course_name FROM courses LIMIT 5")
        courses = cursor.fetchall()
        
        if not courses:
            print("\n❌ No courses found. Cannot create recommendations.")
            cursor.close()
            conn.close()
            return
        
        print(f"\nFound {len(courses)} course(s)")
        
        # Create test attempts for each user
        print("\n" + "=" * 60)
        print("CREATING TEST ATTEMPTS")
        print("=" * 60)
        
        test_attempt_count = 0
        
        for user_id, user_name in users:
            # Create 3 test attempts per user with different scores
            attempts = [
                (user_id, tests[0][0], 7, 10, datetime.now() - timedelta(days=10), 45),
                (user_id, tests[0][0], 8, 10, datetime.now() - timedelta(days=5), 50),
                (user_id, tests[0][0], 9, 10, datetime.now() - timedelta(days=2), 48),
            ]
            
            for attempt in attempts:
                try:
                    # Insert into user_test_attempts
                    cursor.execute("""
                        INSERT INTO user_test_attempts 
                        (user_id, test_id, score, total_questions, attempt_date, time_taken)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, attempt)
                    
                    # Also insert into test_attempts for recommendations FK
                    cursor.execute("""
                        INSERT INTO test_attempts 
                        (user_id, test_id, taken_at)
                        VALUES (%s, %s, %s)
                    """, (attempt[0], attempt[1], attempt[4]))
                    
                    score = int(attempt[2] / attempt[3] * 100)
                    test_attempt_count += 1
                    print(f"✅ {user_name}: {score}% on {tests[0][1]}")
                except Exception as e:
                    print(f"⚠️  Skipping duplicate: {e}")
        
        conn.commit()
        
        # Create recommendations
        print("\n" + "=" * 60)
        print("CREATING RECOMMENDATIONS")
        print("=" * 60)
        
        # Get test attempts we just created
        cursor.execute("""
            SELECT ta.attempt_id, uta.user_id, uta.test_id, uta.score, uta.total_questions, uta.attempt_date
            FROM test_attempts ta
            JOIN user_test_attempts uta ON ta.user_id = uta.user_id AND ta.test_id = uta.test_id
        """)
        
        attempts = cursor.fetchall()
        rec_count = 0
        
        # Clear old recommendations
        cursor.execute("DELETE FROM recommendations")
        
        for attempt in attempts:
            attempt_id, user_id, test_id, score, total_questions, attempt_date = attempt
            percentage = (score / total_questions * 100) if total_questions > 0 else 0
            
            # Select course based on score
            if percentage >= 80:
                selected_course = courses[0]
            elif percentage >= 60:
                selected_course = courses[1 % len(courses)]
            else:
                selected_course = courses[2 % len(courses)]
            
            reasoning = f"Based on your {percentage:.0f}% score, we recommend {selected_course[1]}"
            
            try:
                cursor.execute("""
                    INSERT INTO recommendations 
                    (attempt_id, user_id, course_id, reasoning, recommended_at)
                    VALUES (%s, %s, %s, %s, %s)
                """, (attempt_id, user_id, selected_course[0], reasoning, attempt_date))
                
                rec_count += 1
                print(f"✅ Recommendation for attempt {attempt_id}: {selected_course[1]} ({percentage:.0f}%)")
            except Exception as e:
                print(f"⚠️  Failed to create recommendation: {e}")
        
        # Update user last_login
        cursor.execute("UPDATE users SET last_login = %s WHERE last_login IS NULL", (datetime.now(),))
        
        conn.commit()
        
        # Verify
        cursor.execute("SELECT COUNT(*) FROM user_test_attempts")
        final_attempt_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM recommendations")
        final_rec_count = cursor.fetchone()[0]
        
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"✅ Test attempts: {final_attempt_count}")
        print(f"✅ Recommendations: {final_rec_count}")
        print("\n📝 Data is now persistent in the database!")
        print("   It will survive server restarts and reconnections.")
        
        cursor.close()
        
    except Exception as error:
        print(f"\n❌ Error: {error}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    populate_persistent_data()
