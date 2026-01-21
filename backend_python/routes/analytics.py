from fastapi import APIRouter, HTTPException
from models.database import execute_query, execute_query_one

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# Get system analytics overview
@router.get("/system/overview")
async def get_system_overview():
    try:
        # Total counts
        user_count = execute_query_one('SELECT COUNT(*) as count FROM users')
        course_count = execute_query_one('SELECT COUNT(*) as count FROM courses')
        test_count = execute_query_one('SELECT COUNT(*) as count FROM tests')
        recommendation_count = execute_query_one('SELECT COUNT(*) as count FROM recommendations')
        
        # Recent activity (last 30 days)
        recent_users = execute_query_one("""
            SELECT COUNT(*) as count FROM users 
            WHERE created_at >= NOW() - INTERVAL '30 days'
        """)
        recent_recommendations = execute_query_one("""
            SELECT COUNT(*) as count FROM recommendations 
            WHERE recommended_at >= NOW() - INTERVAL '30 days'
        """)
        
        # System performance metrics
        recommendation_accuracy = execute_query_one("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                ROUND((COUNT(CASE WHEN status = 'accepted' THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) as acceptance_rate
            FROM recommendations
        """)
        
        return {
            "system_overview": {
                "total_users": int(user_count['count']),
                "total_courses": int(course_count['count']),
                "total_tests": int(test_count['count']),
                "total_recommendations": int(recommendation_count['count'])
            },
            "recent_activity": {
                "new_users_30d": int(recent_users['count']),
                "new_recommendations_30d": int(recent_recommendations['count'])
            },
            "system_performance": dict(recommendation_accuracy)
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch system analytics: {str(error)}")
