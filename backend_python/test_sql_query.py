"""Test the exact SQL query from auth endpoint"""
from models.database import execute_query_one

email = "namiaenerson939@gmail.com"

print(f"Testing SQL query with email: {email}\n")

result = execute_query_one("""SELECT 
    user_id,
    username,
    CONCAT(first_name, ' ', last_name) as full_name,
    first_name,
    last_name,
    email,
    password_hash,
    academic_info->>'strand' as strand,
    CAST(academic_info->>'gwa' AS DECIMAL(5,2)) as gwa,
    is_active
FROM users WHERE email = $1""", [email])

print("Result:")
if result:
    for key, value in result.items():
        if key == 'password_hash':
            print(f"  {key}: {value[:20]}..." if value else f"  {key}: {value}")
        else:
            print(f"  {key}: {value}")
else:
    print("  NULL / NO RESULT")
