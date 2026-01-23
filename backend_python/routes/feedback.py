from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
from typing import Optional
import math
from models.database import execute_query, execute_query_one

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

# Pydantic model for feedback submission
class FeedbackSubmission(BaseModel):
    recommendation_id: Optional[int] = None  # Optional for overall feedback
    user_id: Optional[int] = None  # Optional, can be null
    rating: int  # 1-5
    feedback_text: Optional[str] = None

# Get feedback statistics (MUST BE BEFORE /{feedback_id} route)
@router.get("/stats/overview")
async def get_feedback_stats():
    try:
        stats = execute_query_one("""
            SELECT 
                COUNT(*) as total_feedback,
                AVG(rating) as average_rating,
                COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_count,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as neutral_count,
                COUNT(CASE WHEN rating < 3 THEN 1 END) as negative_count,
                COUNT(CASE WHEN feedback_text IS NOT NULL AND feedback_text != '' THEN 1 END) as feedback_with_comments
            FROM recommendation_feedback
        """)
        
        return {
            "total_feedback": stats['total_feedback'] or 0,
            "average_rating": float(stats['average_rating'] or 0),
            "positive_feedback": stats['positive_count'] or 0,
            "neutral_feedback": stats['neutral_count'] or 0,
            "negative_feedback": stats['negative_count'] or 0,
            "feedback_with_comments": stats['feedback_with_comments'] or 0
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(error)}")

# Submit feedback (student endpoint)
@router.post("/submit")
async def submit_feedback(feedback: FeedbackSubmission):
    try:
        # Validate rating is between 1-5
        if not (1 <= feedback.rating <= 5):
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
        # If recommendation_id is provided, check if it exists
        if feedback.recommendation_id:
            rec_exists = execute_query_one(
                "SELECT recommendation_id FROM recommendations WHERE recommendation_id = $1",
                [feedback.recommendation_id]
            )
            if not rec_exists:
                raise HTTPException(status_code=404, detail="Recommendation not found")
        
        # Insert feedback (recommendation_id can be null for overall feedback)
        result = execute_query_one("""
            INSERT INTO recommendation_feedback 
            (recommendation_id, user_id, rating, feedback_text, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING feedback_id, rating, feedback_text, created_at
        """, [feedback.recommendation_id, feedback.user_id, feedback.rating, feedback.feedback_text or ""])
        
        return {
            "success": True,
            "message": "Feedback submitted successfully",
            "feedback_id": result['feedback_id'],
            "created_at": result['created_at']
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(error)}")

# Get all feedback with pagination
@router.get("/")
async def get_feedback(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    user_id: str = Query(""),
    rating: str = Query(""),
    search: str = Query("")
):
    try:
        offset = (page - 1) * limit
        
        query = """
            SELECT 
                rf.feedback_id,
                rf.recommendation_id,
                rf.user_id,
                rf.rating,
                rf.feedback_text,
                rf.created_at,
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.email as user_email,
                c.course_name,
                r.reasoning as recommendation_reasoning
            FROM recommendation_feedback rf
            JOIN users u ON rf.user_id = u.user_id
            LEFT JOIN recommendations r ON rf.recommendation_id = r.recommendation_id
            LEFT JOIN courses c ON r.course_id = c.course_id
            WHERE 1=1
        """
        count_query = 'SELECT COUNT(*) as total FROM recommendation_feedback rf JOIN users u ON rf.user_id = u.user_id WHERE 1=1'
        params = []
        count_params = []
        param_index = 1
        
        # Add user filter
        if user_id:
            query += f" AND rf.user_id = ${param_index}"
            count_query += f" AND user_id = ${param_index}"
            params.append(int(user_id))
            count_params.append(int(user_id))
            param_index += 1
        
        # Add rating filter
        if rating:
            query += f" AND rf.rating = ${param_index}"
            count_query += f" AND rating = ${param_index}"
            params.append(int(rating))
            count_params.append(int(rating))
            param_index += 1
        
        # Add search in feedback text and user name
        if search:
            search_param = f"%{search}%"
            query += f" AND (rf.feedback_text ILIKE ${param_index} OR u.first_name ILIKE ${param_index + 1} OR u.last_name ILIKE ${param_index + 1})"
            count_query += f" AND (feedback_text ILIKE ${param_index} OR user_id IN (SELECT user_id FROM users WHERE CONCAT(first_name, ' ', last_name) ILIKE ${param_index + 1}))"
            params.extend([search_param, search_param])
            count_params.extend([search_param, search_param])
            param_index += 2
        
        query += f" ORDER BY rf.created_at DESC LIMIT ${param_index} OFFSET ${param_index + 1}"
        params.extend([limit, offset])
        
        feedback = execute_query(query, params)
        count_result = execute_query_one(count_query, count_params)
        total = int(count_result['total']) if count_result else 0
        
        return {
            "feedback": feedback or [],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": math.ceil(total / limit) if total > 0 else 1
            }
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch feedback: {str(error)}")

# Get feedback by ID
@router.get("/{feedback_id}")
async def get_feedback_detail(feedback_id: int):
    try:
        feedback = execute_query_one("""
            SELECT 
                rf.feedback_id,
                rf.recommendation_id,
                rf.user_id,
                rf.rating,
                rf.feedback_text,
                rf.created_at,
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.email as user_email,
                c.course_name,
                r.reasoning as recommendation_reasoning
            FROM recommendation_feedback rf
            JOIN users u ON rf.user_id = u.user_id
            LEFT JOIN recommendations r ON rf.recommendation_id = r.recommendation_id
            LEFT JOIN courses c ON r.course_id = c.course_id
            WHERE rf.feedback_id = $1
        """, [feedback_id])
        
        if not feedback:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        return feedback
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch feedback: {str(error)}")
