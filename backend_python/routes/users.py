from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any
from passlib.hash import bcrypt
import math
from models.database import execute_query, execute_query_one

router = APIRouter(prefix="/api/users", tags=["users"])

# Pydantic models
class UserCreate(BaseModel):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    email: EmailStr
    password: str = Field(min_length=6)
    strand: Optional[str] = None
    gwa: Optional[float] = Field(None, ge=75, le=100)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    strand: Optional[str] = None
    gwa: Optional[float] = Field(None, ge=75, le=100)

# Get all users with pagination and search
@router.get("/")
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(""),
    strand: str = Query("")
):
    try:
        offset = (page - 1) * limit
        
        query = """SELECT 
            user_id, 
            username,
            CONCAT(first_name, ' ', last_name) as full_name,
            first_name,
            last_name,
            email, 
            academic_info->>'strand' as strand,
            CAST(academic_info->>'gwa' AS DECIMAL(5,2)) as gwa,
            created_at,
            is_active,
            last_login,
            (SELECT COUNT(*) FROM user_test_attempts uta JOIN tests t ON uta.test_id = t.test_id WHERE uta.user_id = users.user_id AND t.test_type = 'adaptive') as tests_taken,
            (SELECT MAX(attempt_date) FROM user_test_attempts uta JOIN tests t ON uta.test_id = t.test_id WHERE uta.user_id = users.user_id AND t.test_type = 'adaptive') as last_test_date
        FROM users WHERE 1=1"""
        
        count_query = "SELECT COUNT(*) as total FROM users WHERE 1=1"
        params = []
        count_params = []
        param_index = 1
        
        # Add search filter
        if search:
            search_param = f"%{search}%"
            query += f" AND (first_name ILIKE ${param_index} OR last_name ILIKE ${param_index + 1} OR email ILIKE ${param_index + 2})"
            count_query += f" AND (first_name ILIKE ${param_index} OR last_name ILIKE ${param_index + 1} OR email ILIKE ${param_index + 2})"
            params.extend([search_param, search_param, search_param])
            count_params.extend([search_param, search_param, search_param])
            param_index += 3
        
        # Add strand filter
        if strand:
            query += f" AND academic_info->>'strand' = ${param_index}"
            count_query += f" AND academic_info->>'strand' = ${param_index}"
            params.append(strand)
            count_params.append(strand)
            param_index += 1
        
        query += f" ORDER BY created_at DESC LIMIT ${param_index} OFFSET ${param_index + 1}"
        params.extend([limit, offset])
        
        users = execute_query(query, params)
        count_result = execute_query_one(count_query, count_params)
        total = int(count_result['total'])
        
        return {
            "users": users,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": math.ceil(total / limit)
            }
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(error)}")

# Get user by ID
@router.get("/{user_id}")
async def get_user(user_id: int):
    try:
        user = execute_query_one(
            """SELECT 
                user_id,
                username,
                CONCAT(first_name, ' ', last_name) as full_name,
                first_name,
                last_name,
                email,
                academic_info->>'strand' as strand,
                CAST(academic_info->>'gwa' AS DECIMAL(5,2)) as gwa,
                academic_info,
                created_at 
            FROM users WHERE user_id = $1""",
            [user_id]
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user: {str(error)}")

# Create new user
@router.post("/", status_code=201)
async def create_user(user: UserCreate):
    try:
        # Parse full_name if provided
        first_name = user.first_name
        last_name = user.last_name
        
        if user.full_name and not user.first_name and not user.last_name:
            name_parts = user.full_name.split(' ')
            first_name = name_parts[0]
            last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else name_parts[0]
        
        # Hash password (bcrypt has 72-byte limit, truncate if necessary)
        password_to_hash = user.password[:72]
        hashed_password = bcrypt.hash(password_to_hash)
        
        # Create academic_info JSON
        academic_info = {
            "strand": user.strand,
            "gwa": float(user.gwa) if user.gwa else None
        }
        
        username = user.username if user.username else user.email.split('@')[0]
        
        result = execute_query_one(
            """INSERT INTO users (username, first_name, last_name, email, password_hash, academic_info) 
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id""",
            [username, first_name, last_name, user.email, hashed_password, str(academic_info).replace("'", '"')]
        )
        
        return {
            "message": "User created successfully",
            "user_id": result['user_id']
        }
    except Exception as error:
        if 'duplicate key' in str(error) or '23505' in str(error):
            raise HTTPException(status_code=409, detail="Email already exists")
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(error)}")

# Update user
@router.put("/{user_id}")
async def update_user(user_id: int, user: UserUpdate):
    try:
        updates = []
        params = []
        param_index = 1
        
        # Handle name updates
        first_name = user.first_name
        last_name = user.last_name
        
        if user.full_name and not user.first_name and not user.last_name:
            name_parts = user.full_name.split(' ')
            first_name = name_parts[0]
            last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else name_parts[0]
        
        if first_name:
            updates.append(f"first_name = ${param_index}")
            params.append(first_name)
            param_index += 1
        
        if last_name:
            updates.append(f"last_name = ${param_index}")
            params.append(last_name)
            param_index += 1
        
        if user.email:
            updates.append(f"email = ${param_index}")
            params.append(user.email)
            param_index += 1
        
        # Handle academic_info JSON update
        if user.strand or user.gwa:
            current = execute_query_one('SELECT academic_info FROM users WHERE user_id = $1', [user_id])
            if not current:
                raise HTTPException(status_code=404, detail="User not found")
            
            academic_info = current.get('academic_info', {}) if current.get('academic_info') else {}
            if user.strand:
                academic_info['strand'] = user.strand
            if user.gwa:
                academic_info['gwa'] = float(user.gwa)
            
            updates.append(f"academic_info = ${param_index}")
            params.append(str(academic_info).replace("'", '"'))
            param_index += 1
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE user_id = ${param_index}"
        
        result = execute_query(query, params, fetch=False)
        
        if result == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User updated successfully"}
    except HTTPException:
        raise
    except Exception as error:
        if 'duplicate key' in str(error) or '23505' in str(error):
            raise HTTPException(status_code=409, detail="Email already exists")
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(error)}")

# Delete user
@router.delete("/{user_id}")
async def delete_user(user_id: int):
    try:
        result = execute_query('DELETE FROM users WHERE user_id = $1', [user_id], fetch=False)
        
        if result == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(error)}")

# Get user statistics
@router.get("/stats/overview")
async def get_user_stats():
    try:
        total_users = execute_query_one('SELECT COUNT(*) as count FROM users')
        
        strand_distribution = execute_query("""
            SELECT academic_info->>'strand' as strand, COUNT(*) as count
            FROM users
            WHERE academic_info->>'strand' IS NOT NULL
            GROUP BY academic_info->>'strand'
        """)
        
        gwa_stats = execute_query_one("""
            SELECT 
                ROUND(AVG(CAST(academic_info->>'gwa' AS DECIMAL))::numeric, 2) as average,
                MIN(CAST(academic_info->>'gwa' AS DECIMAL)) as minimum,
                MAX(CAST(academic_info->>'gwa' AS DECIMAL)) as maximum
            FROM users
            WHERE academic_info->>'gwa' IS NOT NULL
        """)
        
        recent_users = execute_query("""
            SELECT 
                user_id,
                CONCAT(first_name, ' ', last_name) as full_name,
                email,
                created_at
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        
        return {
            "total": int(total_users['count']),
            "strandDistribution": strand_distribution,
            "gwaStats": gwa_stats,
            "recentUsers": recent_users
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch statistics: {str(error)}")
# Get user test history
@router.get("/{user_id}/test-history")
async def get_user_test_history(user_id: int):
    try:
        # Check if user exists
        user = execute_query_one('SELECT user_id FROM users WHERE user_id = $1', [user_id])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        test_history = execute_query("""
            SELECT 
                uta.attempt_id,
                uta.test_id,
                t.test_name,
                t.description,
                t.test_type,
                uta.score,
                uta.total_questions,
                CASE 
                    WHEN uta.total_questions > 0 THEN ROUND((uta.score::float / uta.total_questions * 100)::numeric, 2)
                    ELSE 0
                END as percentage,
                uta.attempt_date,
                uta.time_taken
            FROM user_test_attempts uta
            JOIN tests t ON uta.test_id = t.test_id
            WHERE uta.user_id = $1 AND t.test_type = 'adaptive'
            ORDER BY uta.attempt_date DESC
        """, [user_id])
        
        return {
            "test_history": test_history or [],
            "total_tests_taken": len(test_history) if test_history else 0
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch test history: {str(error)}")

# Deactivate/Activate user account
@router.patch("/{user_id}/status")
async def update_user_status(user_id: int, status: Dict[str, Any]):
    try:
        is_active = status.get('is_active', False)
        
        # Check if user exists
        user = execute_query_one('SELECT user_id FROM users WHERE user_id = $1', [user_id])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        execute_query(
            'UPDATE users SET is_active = $1 WHERE user_id = $2',
            [is_active, user_id],
            fetch=False
        )
        
        status_text = "activated" if is_active else "deactivated"
        return {"message": f"User {status_text} successfully"}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to update user status: {str(error)}")