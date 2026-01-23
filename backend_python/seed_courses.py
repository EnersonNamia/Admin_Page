"""
Database seeding script to populate courses table with all available programs
"""

import psycopg2
from psycopg2.extras import execute_batch
import os
from dotenv import load_dotenv

load_dotenv()

# All courses to be seeded
COURSES = [
    "BS Computer Science",
    "BS Information Technology",
    "BS Civil Engineering",
    "BS Computer Engineering",
    "BS Electronics Engineering",
    "BS Mechanical Engineering",
    "BS Electrical Engineering",
    "BS Data Science",
    "BS Mathematics",
    "BS Statistics",
    "BS Geodetic Engineering",
    "BS Industrial Engineering",
    "BS Cybersecurity",
    "BS Accountancy",
    "BS Business Administration major in Marketing Management",
    "BS Business Administration major in Financial Management",
    "BS Business Administration major in Human Resource Management",
    "BS Entrepreneurship",
    "BS Customs Administration",
    "BS Real Estate Management",
    "BS Accounting Information Systems",
    "BS Management Accounting",
    "BS Business Administration major in Operations Management",
    "BS Business Economics",
    "BS Agribusiness",
    "BS Legal Management",
    "Bachelor of Public Administration",
    "BS Medical Technology",
    "BS Pharmacy",
    "BS Physical Therapy",
    "BS Occupational Therapy",
    "BS Biology",
    "BS Radiologic Technology",
    "BS Nutrition and Dietetics",
    "BS Midwifery",
    "BS Nursing",
    "BS Speech-Language Pathology",
    "BS Respiratory Therapy",
    "BS Chemistry",
    "BS Marine Biology",
    "BS Environmental Science",
    "BS Optometry",
    "BS Health Information Management",
    "BS Biotechnology",
    "BS Exercise and Sports Science",
    "BS Psychology",
    "BS Interior Design",
    "Bachelor of Fine Arts",
    "BA in Communication",
    "BS Entertainment and Multimedia Computing",
    "BA in Fashion Design and Merchandising",
    "BS Industrial Design",
    "BA in Digital Filmmaking",
    "BS Clothing Technology",
    "BS Architecture",
    "BS Multimedia Arts",
    "BA in Advertising Arts",
    "BA in Animation",
    "BA in Game Art and Design",
    "BA in Photography",
    "BA in Music Production",
    "BA in Theater Arts",
    "BS Landscape Architecture",
    "BA in Journalism",
    "BS Criminology",
    "BS Hospitality Management",
    "Bachelor of Secondary Education",
    "BS Tourism Management",
    "BS Office Administration",
    "Bachelor of Elementary Education",
    "BA in Political Science",
    "BS Social Work",
    "BS Development Communication",
    "Bachelor of Library and Information Science",
    "BS Community Development",
    "BS Forensic Science",
    "Bachelor of Special Needs Education",
    "BA in International Studies",
    "BA in Sociology",
    "BA in Philosophy",
    "Bachelor of Early Childhood Education",
    "Bachelor of Physical Education",
    "BA in Linguistics",
    "BS Environmental Planning",
    "BS Marine Transportation",
    "BS Marine Engineering",
    "BS Agriculture",
    "BS Forestry",
    "BS Fisheries",
    "Doctor of Veterinary Medicine",
    "BS Aeronautical Engineering",
    "BS Aircraft Maintenance Technology",
    "BS Aviation Electronics Technology",
    "BS Geology",
    "BS Physics",
    "BS Meteorology",
    "BS Food Technology",
    "BS Culinary Management",
    "Bachelor of Technical-Vocational Teacher Education",
]

def seed_courses():
    """Insert all courses into the database"""
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
        
        # Prepare data for batch insert
        # Format: (course_name, description, required_strand, minimum_gwa)
        course_data = [
            (
                course,
                f"Description for {course}",  # Default description
                "STEM" if any(term in course for term in ["Engineering", "Science", "Technology", "Computer", "Data", "Mathematics", "Statistics", "Physics", "Chemistry", "Biology", "Geology", "Forestry", "Fisheries", "Veterinary", "Geology"]) 
                else "HUMSS" if any(term in course for term in ["Communication", "Journalism", "Philosophy", "Sociology", "Psychology", "Political", "Linguistics", "International", "Tourism", "Hospitality", "Business", "Accountancy", "Management", "Entrepreneurship", "Legal", "Public Administration", "Development", "Social Work"])
                else "ABM" if any(term in course for term in ["Business", "Accountancy", "Entrepreneurship", "Management"])
                else "STEM",
                75.0  # Default minimum GWA
            )
            for course in COURSES
        ]
        
        # Check if courses already exist to avoid duplicates
        cursor.execute("SELECT COUNT(*) FROM courses WHERE course_name IN (%s)" % 
                      ",".join(["%s"] * len(COURSES)), COURSES)
        existing_count = cursor.fetchone()[0]
        
        if existing_count > 0:
            print(f"⚠️  {existing_count} course(s) already exist in the database.")
            response = input("Do you want to clear existing courses and start fresh? (yes/no): ")
            if response.lower() == 'yes':
                cursor.execute("DELETE FROM courses")
                print("Cleared existing courses.")
            else:
                print("Aborting to prevent duplicates.")
                return
        
        # Insert courses using batch insert for efficiency
        insert_query = """
            INSERT INTO courses (course_name, description, required_strand, minimum_gwa)
            VALUES (%s, %s, %s, %s)
        """
        
        execute_batch(cursor, insert_query, course_data, page_size=1000)
        conn.commit()
        
        # Verify the insertion
        cursor.execute("SELECT COUNT(*) FROM courses")
        total_courses = cursor.fetchone()[0]
        
        print(f"✅ Successfully seeded {total_courses} courses into the database!")
        print(f"   Total courses now available: {total_courses}")
        
        cursor.close()
        
    except Exception as error:
        print(f"❌ Error seeding database: {error}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("🌱 Starting course seeding process...")
    print(f"   Courses to insert: {len(COURSES)}")
    seed_courses()
