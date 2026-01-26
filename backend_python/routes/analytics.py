from fastapi import APIRouter, HTTPException
from models.database import execute_query, execute_query_one
from datetime import datetime, timedelta

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


# ========== ADMIN ANALYTICS API ENDPOINTS ==========

@router.get("/admin/overview")
async def get_admin_analytics_overview():
    """
    Get system-wide analytics for admin dashboard
    - Total assessments taken
    - Total recommendations generated
    - Total users active
    - System health metrics
    """
    try:
        total_users = execute_query_one('SELECT COUNT(*) as count FROM users')
        # Only count adaptive test attempts for total assessments
        total_assessments = execute_query_one("""
            SELECT COUNT(*) as count FROM user_test_attempts uta
            JOIN tests t ON uta.test_id = t.test_id
            WHERE t.test_type = 'adaptive'
        """)
        total_recommendations = execute_query_one('SELECT COUNT(*) as count FROM recommendations')
        
        # Get assessment breakdown by type
        standard_assessments = execute_query_one("""
            SELECT COUNT(*) as count FROM user_test_attempts uta
            JOIN tests t ON uta.test_id = t.test_id
            WHERE t.test_type = 'assessment'
        """)
        
        adaptive_assessments = execute_query_one("""
            SELECT COUNT(*) as count FROM user_test_attempts uta
            JOIN tests t ON uta.test_id = t.test_id
            WHERE t.test_type = 'adaptive'
        """)
        
        # Average recommendations per assessment
        total_assess = int(total_assessments['count'])
        total_recs = int(total_recommendations['count'])
        avg_recommendations = total_recs / total_assess if total_assess > 0 else 0
        
        return {
            "success": True,
            "timestamp": str(datetime.now()),
            "overview": {
                "total_users": int(total_users['count']),
                "total_assessments_taken": total_assess,
                "total_recommendations_generated": total_recs,
                "average_recommendations_per_assessment": round(avg_recommendations, 2),
                "assessment_breakdown": {
                    "standard_assessment": int(standard_assessments['count']),
                    "smart_assessment_adaptive": int(adaptive_assessments['count'])
                }
            }
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch admin overview: {str(error)}")


@router.get("/admin/assessments")
async def get_assessments_analytics():
    """
    Get detailed assessment statistics
    - Assessments by type
    - Assessments by date
    - Assessment completion rates
    """
    try:
        # Total by type
        assessment_types = execute_query("""
            SELECT 
                t.test_type,
                t.test_name,
                COUNT(uta.attempt_id) as count
            FROM tests t
            LEFT JOIN user_test_attempts uta ON t.test_id = uta.test_id
            GROUP BY t.test_id, t.test_type, t.test_name
            ORDER BY count DESC
        """)
        
        # Assessments by date (last 30 days)
        assessments_by_date = execute_query("""
            SELECT 
                DATE(attempt_date) as date,
                COUNT(attempt_id) as count
            FROM user_test_attempts
            WHERE attempt_date >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(attempt_date)
            ORDER BY date ASC
        """)
        
        return {
            "success": True,
            "assessments": {
                "by_type": [
                    {
                        "type": t['test_type'],
                        "name": t['test_name'],
                        "total": t['count']
                    }
                    for t in assessment_types
                ],
                "by_date_last_30_days": [
                    {
                        "date": str(a['date']),
                        "count": a['count']
                    }
                    for a in assessments_by_date
                ]
            }
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch assessments analytics: {str(error)}")


@router.get("/admin/users/{user_id}/assessments")
async def get_user_assessment_history_admin(user_id: int):
    """
    Get COMPLETE assessment history for a specific user (admin view)
    - How many assessments they took
    - When they took them
    - Recommendations from each assessment
    - Questions and answers from each assessment
    """
    try:
        user = execute_query_one("""
            SELECT user_id, first_name, last_name, email 
            FROM users 
            WHERE user_id = %s
        """, [user_id])
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get all test attempts
        attempts = execute_query("""
            SELECT * FROM user_test_attempts 
            WHERE user_id = %s
            ORDER BY attempt_date DESC
        """, [user_id])
        
        assessment_history = []
        
        for attempt in attempts:
            # Get test details
            test = execute_query_one("""
                SELECT * FROM tests WHERE test_id = %s
            """, [attempt['test_id']])
            
            # Get recommendations for this attempt (if stored with attempt_id reference)
            recommendations = execute_query("""
                SELECT * FROM recommendations WHERE user_id = %s
                ORDER BY recommended_at DESC LIMIT 10
            """, [user_id])
            
            recommended_courses = []
            for rec in recommendations:
                course = execute_query_one("""
                    SELECT * FROM courses WHERE course_id = %s
                """, [rec['course_id']])
                
                if course:
                    recommended_courses.append({
                        "course_id": course['course_id'],
                        "course_name": course['course_name'],
                        "description": course.get('description', ''),
                        "minimum_gwa": float(course['minimum_gwa']) if course.get('minimum_gwa') else None,
                        "required_strand": course.get('required_strand', ''),
                        "trait_tag": course.get('trait_tag', ''),
                        "reasoning": rec.get('reasoning', ''),
                        "recommended_at": str(rec['recommended_at']) if rec.get('recommended_at') else None
                    })
            
            assessment_history.append({
                "attempt_id": attempt['attempt_id'],
                "assessment_type": test['test_type'] if test else "unknown",
                "assessment_name": test['test_name'] if test else "Unknown Assessment",
                "taken_at": str(attempt['attempt_date']),
                "score": attempt.get('score', 0),
                "total_questions": attempt.get('total_questions', 0),
                "time_taken": attempt.get('time_taken', 0),
                "total_recommendations": len(recommended_courses),
                "recommended_courses": recommended_courses
            })
        
        return {
            "success": True,
            "user_id": user_id,
            "user_name": f"{user['first_name']} {user['last_name']}".strip(),
            "user_email": user['email'],
            "total_assessments_taken": len(attempts),
            "assessment_history": assessment_history
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user assessment history: {str(error)}")


@router.get("/admin/all-users-summary")
async def get_all_users_assessment_summary():
    """
    Get summary of ALL users with their assessment counts
    - How many assessments each user took
    - When they last took an assessment
    - Total recommendations received by each user
    """
    try:
        users_data = execute_query("""
            SELECT 
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                COUNT(uta.attempt_id) as assessment_count,
                MAX(uta.attempt_date) as last_assessment
            FROM users u
            LEFT JOIN user_test_attempts uta ON u.user_id = uta.user_id
            GROUP BY u.user_id, u.first_name, u.last_name, u.email
            ORDER BY COUNT(uta.attempt_id) DESC
        """)
        
        users_summary = []
        for user in users_data:
            # Get total recommendations for this user
            total_recs = execute_query_one("""
                SELECT COUNT(*) as count FROM recommendations WHERE user_id = %s
            """, [user['user_id']])
            
            users_summary.append({
                "user_id": user['user_id'],
                "fullname": f"{user['first_name']} {user['last_name']}".strip(),
                "email": user['email'],
                "assessments_taken": user['assessment_count'] or 0,
                "last_assessment_date": str(user['last_assessment']) if user['last_assessment'] else None,
                "total_recommendations_received": int(total_recs['count']) if total_recs else 0
            })
        
        return {
            "success": True,
            "total_users": len(users_summary),
            "users": users_summary
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users summary: {str(error)}")


@router.get("/admin/recommendations-summary")
async def get_recommendations_summary():
    """
    Get overall recommendations analytics
    - Most recommended courses
    - Least recommended courses
    - Total recommendations breakdown
    """
    try:
        most_recommended = execute_query("""
            SELECT 
                c.course_id,
                c.course_name,
                c.description,
                COUNT(r.recommendation_id) as recommendation_count
            FROM courses c
            LEFT JOIN recommendations r ON c.course_id = r.course_id
            GROUP BY c.course_id, c.course_name, c.description
            ORDER BY COUNT(r.recommendation_id) DESC
            LIMIT 10
        """)
        
        total_recs = execute_query_one('SELECT COUNT(*) as count FROM recommendations')
        
        return {
            "success": True,
            "most_recommended_courses": [
                {
                    "course_id": c['course_id'],
                    "course_name": c['course_name'],
                    "description": c.get('description', ''),
                    "times_recommended": c['recommendation_count']
                }
                for c in most_recommended
            ],
            "total_recommendations_in_system": int(total_recs['count'])
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recommendations summary: {str(error)}")


@router.get("/admin/export")
async def export_analytics_data():
    """
    Export all analytics data for the admin dashboard
    Combines all analytics into one comprehensive endpoint
    """
    try:
        # Overview stats
        total_users = execute_query_one('SELECT COUNT(*) as count FROM users')
        total_assessments = execute_query_one('SELECT COUNT(*) as count FROM user_test_attempts')
        total_recommendations = execute_query_one('SELECT COUNT(*) as count FROM recommendations')
        
        # User with most assessments
        user_with_most = execute_query_one("""
            SELECT 
                CONCAT(u.first_name, ' ', u.last_name) as fullname,
                COUNT(uta.attempt_id) as count
            FROM users u
            LEFT JOIN user_test_attempts uta ON u.user_id = uta.user_id
            GROUP BY u.user_id, u.first_name, u.last_name
            ORDER BY COUNT(uta.attempt_id) DESC
            LIMIT 1
        """)
        
        total_users_count = int(total_users['count'])
        total_assess_count = int(total_assessments['count'])
        
        return {
            "success": True,
            "export_timestamp": str(datetime.now()),
            "summary": {
                "total_users": total_users_count,
                "total_assessments_taken": total_assess_count,
                "total_recommendations_generated": int(total_recommendations['count']),
                "average_assessments_per_user": round(total_assess_count / total_users_count, 2) if total_users_count > 0 else 0,
                "most_active_user": user_with_most['fullname'] if user_with_most else "N/A",
                "most_active_user_assessments": user_with_most['count'] if user_with_most else 0
            },
            "data_ready_for_export": True,
            "endpoints_available": [
                "/api/analytics/admin/overview",
                "/api/analytics/admin/assessments",
                "/api/analytics/admin/users/{user_id}/assessments",
                "/api/analytics/admin/all-users-summary",
                "/api/analytics/admin/recommendations-summary"
            ]
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to export analytics data: {str(error)}")
