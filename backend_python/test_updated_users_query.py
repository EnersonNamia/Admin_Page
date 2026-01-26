"""Test the updated users query with user_activity table"""
from models.database import execute_query

print("=" * 80)
print("TESTING UPDATED USERS QUERY WITH user_activity TABLE")
print("=" * 80)

# Test the new query
query = """
    SELECT 
        u.user_id,
        u.username,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        u.email,
        u.academic_info->>'strand' as strand,
        CAST(u.academic_info->>'gwa' AS DECIMAL(5,2)) as gwa,
        u.is_active,
        COALESCE(u.last_login, ua.last_activity) as last_login,
        COUNT(CASE WHEN t.test_type = 'adaptive' THEN 1 END) as tests_taken,
        MAX(CASE WHEN t.test_type = 'adaptive' THEN uta.attempt_date END) as last_test_date
    FROM users u
    LEFT JOIN user_activity ua ON u.user_id = ua.user_id
    LEFT JOIN user_test_attempts uta ON u.user_id = uta.user_id
    LEFT JOIN tests t ON uta.test_id = t.test_id
    WHERE 1=1
    GROUP BY u.user_id, u.username, u.first_name, u.last_name, u.email, u.academic_info, u.is_active, u.last_login, ua.last_activity
    ORDER BY u.user_id
    LIMIT 10
"""

try:
    users = execute_query(query, [])
    print(f"\n✅ Query executed successfully! Found {len(users)} users\n")
    
    print(f"{'Name':<25} {'Email':<35} {'Last Login':<30} {'Tests'}")
    print("-" * 90)
    
    for user in users:
        last_login = user['last_login'] if user['last_login'] else 'Never'
        tests = user['tests_taken'] or 0
        last_login_str = str(last_login)[:30] if last_login != 'Never' else 'Never'
        print(f"{user['full_name']:<25} {user['email']:<35} {last_login_str:<30} {tests}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nThis likely means the user_activity table doesn't exist yet.")
    print("Make sure the User Page backend has been run with the activity tracking migrations.")

print("\n" + "=" * 80)
