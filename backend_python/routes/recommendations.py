from fastapi import APIRouter, HTTPException, Query
import math
from models.database import execute_query, execute_query_one

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

# Get all recommendations with pagination and filtering
@router.get("/")
async def get_recommendations(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    user_id: str = Query(""),
    course_id: str = Query("")
):
    try:
        offset = (page - 1) * limit
        
        query = """
            SELECT 
                r.recommendation_id,
                r.attempt_id,
                r.user_id,
                r.course_id,
                r.reasoning,
                r.recommended_at,
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.email as user_email,
                c.course_name
            FROM recommendations r
            JOIN users u ON r.user_id = u.user_id
            JOIN courses c ON r.course_id = c.course_id
            WHERE 1=1
        """
        count_query = 'SELECT COUNT(*) as total FROM recommendations r WHERE 1=1'
        params = []
        count_params = []
        param_index = 1
        
        # Add user filter
        if user_id:
            query += f" AND r.user_id = ${param_index}"
            count_query += f" AND user_id = ${param_index}"
            params.append(int(user_id))
            count_params.append(int(user_id))
            param_index += 1
        
        # Add course filter
        if course_id:
            query += f" AND r.course_id = ${param_index}"
            count_query += f" AND course_id = ${param_index}"
            params.append(int(course_id))
            count_params.append(int(course_id))
            param_index += 1
        
        query += f" ORDER BY r.recommended_at DESC LIMIT ${param_index} OFFSET ${param_index + 1}"
        params.extend([limit, offset])
        
        recommendations = execute_query(query, params)
        count_result = execute_query_one(count_query, count_params)
        total = int(count_result['total']) if count_result else 0
        
        return {
            "recommendations": recommendations or [],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": math.ceil(total / limit) if total > 0 else 1
            }
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recommendations: {str(error)}")

# Get recommendation by ID
@router.get("/{recommendation_id}")
async def get_recommendation(recommendation_id: int):
    try:
        recommendation = execute_query_one("""
            SELECT 
                r.*,
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.email as user_email,
                c.course_name,
                c.description as course_description
            FROM recommendations r
            JOIN users u ON r.user_id = u.user_id
            JOIN courses c ON r.course_id = c.course_id
            WHERE r.recommendation_id = $1
        """, [recommendation_id])
        
        if not recommendation:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        
        return recommendation
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recommendation: {str(error)}")
