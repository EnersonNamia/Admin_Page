"""Check if last_login is being updated after auth login"""
from models.database import execute_query
from datetime import datetime, timezone, timedelta

print("=" * 80)
print("CHECKING LAST_LOGIN TIMESTAMPS")
print("=" * 80)

users = execute_query("""
    SELECT 
        user_id,
        CONCAT(first_name, ' ', last_name) as full_name,
        email,
        last_login,
        is_active
    FROM users
    ORDER BY user_id
""")

if users:
    print(f"\n{'Name':<25} {'Email':<35} {'Last Login':<35} {'Status'}")
    print("-" * 100)
    
    now = datetime.now(timezone.utc)
    
    for user in users:
        last_login = user['last_login']
        status = "Active" if user['is_active'] else "Inactive"
        
        if last_login:
            # Handle timezone-aware and naive datetimes
            if last_login.tzinfo is None:
                last_login = last_login.replace(tzinfo=timezone.utc)
            
            diff_seconds = (now - last_login).total_seconds()
            diff_mins = int(diff_seconds / 60)
            diff_hours = int(diff_seconds / 3600)
            diff_days = int(diff_seconds / 86400)
            
            if diff_mins < 1:
                time_str = "Just now"
            elif diff_mins < 60:
                time_str = f"{diff_mins}m ago"
            elif diff_hours < 24:
                time_str = f"{diff_hours}h ago"
            else:
                time_str = f"{diff_days}d ago"
            
            last_login_str = str(last_login)[:19]  # Just date and time
        else:
            last_login_str = "Never"
            time_str = "Never"
        
        print(f"{user['full_name']:<25} {user['email']:<35} {last_login_str:<35} {time_str}")

print("\n" + "=" * 80)
print("If kamansi shows 'Just now' or recent time, last_login IS being updated!")
print("=" * 80)
