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
    # Check if feedback already exists
    cur.execute("SELECT COUNT(*) as count FROM recommendation_feedback")
    result = cur.fetchone()
    
    if result['count'] > 0:
        print(f"✅ Feedback table already populated with {result['count']} entries")
    else:
        print("Adding sample feedback data...")
        
        # Get some recommendations to add feedback to
        cur.execute("""
            SELECT recommendation_id, user_id, course_id 
            FROM recommendations 
            LIMIT 12
        """)
        recommendations = cur.fetchall()
        
        if not recommendations:
            print("❌ No recommendations found. Run populate_persistent_data.py first.")
        else:
            # Sample feedback data
            feedback_samples = [
                {"rating": 5, "text": "Great recommendation! This course helped me improve my skills."},
                {"rating": 5, "text": "Excellent! The course content was exactly what I needed."},
                {"rating": 4, "text": "Good recommendation, though I wish it covered more advanced topics."},
                {"rating": 4, "text": "Helpful course with practical examples."},
                {"rating": 3, "text": "Okay, but expected more depth in the curriculum."},
                {"rating": 5, "text": "Outstanding! The instructor explained concepts very clearly."},
                {"rating": 5, "text": "Perfect match for my learning goals."},
                {"rating": 4, "text": "Good course, but pacing was a bit fast."},
                {"rating": 3, "text": "Decent course, but could be better organized."},
                {"rating": 2, "text": "Not as helpful as I expected."},
                {"rating": 4, "text": "Solid course with good assignments."},
                {"rating": 5, "text": "One of the best courses I've taken!"},
            ]
            
            # Insert feedback for each recommendation
            for i, rec in enumerate(recommendations):
                feedback = feedback_samples[i % len(feedback_samples)]
                cur.execute("""
                    INSERT INTO recommendation_feedback 
                    (recommendation_id, user_id, rating, feedback_text, created_at)
                    VALUES (%s, %s, %s, %s, NOW())
                """, (rec['recommendation_id'], rec['user_id'], feedback['rating'], feedback['text']))
            
            conn.commit()
            print(f"✅ Added {len(recommendations)} feedback entries to the database")
            
            # Show feedback stats
            cur.execute("""
                SELECT 
                    COUNT(*) as total,
                    AVG(rating) as avg_rating,
                    MAX(rating) as max_rating,
                    MIN(rating) as min_rating
                FROM recommendation_feedback
            """)
            stats = cur.fetchone()
            print(f"\n📊 Feedback Statistics:")
            print(f"   Total feedback: {stats['total']}")
            print(f"   Average rating: {stats['avg_rating']:.2f}")
            print(f"   Rating range: {stats['min_rating']} - {stats['max_rating']}")

except Exception as error:
    print(f"❌ Error: {error}")
    conn.rollback()
finally:
    cur.close()
    conn.close()
    print("\n✅ Done!")
