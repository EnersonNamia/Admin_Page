from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from passlib.hash import bcrypt
from datetime import datetime, timezone
from models.database import execute_query, execute_query_one

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Pydantic models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Login endpoint
@router.post("/login")
async def login(credentials: LoginRequest):
    try:
        # Find user by email
        user = execute_query_one(
            """SELECT 
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
            FROM users WHERE email = $1""",
            [credentials.email]
        )
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password (bcrypt has a 72-byte limit, truncate if needed)
        password_to_check = credentials.password[:72]
        if not bcrypt.verify(password_to_check, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if user is active
        if not user['is_active']:
            raise HTTPException(status_code=403, detail="Account is deactivated")
        
        # Update last_login timestamp
        current_time = datetime.now(timezone.utc)
        execute_query(
            "UPDATE users SET last_login = $1 WHERE user_id = $2",
            [current_time, user['user_id']],
            fetch=False
        )
        
        # Return user info (without password)
        return {
            "token": f"token_{user['user_id']}_{datetime.now().timestamp()}",  # Simple token
            "user": {
                "id": user['user_id'],
                "email": user['email'],
                "full_name": user['full_name'],
                "username": user['username'],
                "strand": user['strand'],
                "gwa": user['gwa']
            },
            "message": "Login successful"
        }
    
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(error)}")

# Logout endpoint (optional - can update last_activity or session)
@router.post("/logout")
async def logout(user_id: int):
    try:
        # You could track logout time if needed
        return {"message": "Logout successful"}
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Logout failed: {str(error)}")
