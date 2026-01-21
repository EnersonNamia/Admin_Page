from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
import math
from models.database import execute_query, execute_query_one

router = APIRouter(prefix="/api/courses", tags=["courses"])

# Pydantic models
class CourseCreate(BaseModel):
    course_name: str
    description: str
    required_strand: str
    minimum_gwa: float = Field(ge=75, le=100)

class CourseUpdate(BaseModel):
    course_name: Optional[str] = None
    description: Optional[str] = None
    required_strand: Optional[str] = None
    minimum_gwa: Optional[float] = Field(None, ge=75, le=100)

# Get all courses with pagination and search
@router.get("/")
async def get_courses(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(""),
    strand: str = Query("")
):
    try:
        offset = (page - 1) * limit
        
        query = "SELECT * FROM courses WHERE 1=1"
        count_query = "SELECT COUNT(*) as total FROM courses WHERE 1=1"
        params = []
        count_params = []
        param_index = 1
        
        # Add search filter
        if search:
            search_param = f"%{search}%"
            query += f" AND (course_name ILIKE ${param_index} OR description ILIKE ${param_index + 1})"
            count_query += f" AND (course_name ILIKE ${param_index} OR description ILIKE ${param_index + 1})"
            params.extend([search_param, search_param])
            count_params.extend([search_param, search_param])
            param_index += 2
        
        # Add strand filter
        if strand:
            query += f" AND required_strand = ${param_index}"
            count_query += f" AND required_strand = ${param_index}"
            params.append(strand)
            count_params.append(strand)
            param_index += 1
        
        query += f" ORDER BY course_id DESC LIMIT ${param_index} OFFSET ${param_index + 1}"
        params.extend([limit, offset])
        
        courses = execute_query(query, params)
        count_result = execute_query_one(count_query, count_params)
        total = int(count_result['total'])
        
        return {
            "courses": courses,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": math.ceil(total / limit)
            }
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch courses: {str(error)}")

# Get course by ID
@router.get("/{course_id}")
async def get_course(course_id: int):
    try:
        course = execute_query_one('SELECT * FROM courses WHERE course_id = $1', [course_id])
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        return course
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch course: {str(error)}")

# Create new course
@router.post("/", status_code=201)
async def create_course(course: CourseCreate):
    try:
        result = execute_query_one(
            'INSERT INTO courses (course_name, description, required_strand, minimum_gwa) VALUES ($1, $2, $3, $4) RETURNING course_id',
            [course.course_name, course.description, course.required_strand, course.minimum_gwa]
        )
        
        return {
            "message": "Course created successfully",
            "course_id": result['course_id']
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to create course: {str(error)}")

# Update course
@router.put("/{course_id}")
async def update_course(course_id: int, course: CourseUpdate):
    try:
        result = execute_query(
            'UPDATE courses SET course_name = COALESCE($1, course_name), description = COALESCE($2, description), required_strand = COALESCE($3, required_strand), minimum_gwa = COALESCE($4, minimum_gwa) WHERE course_id = $5',
            [course.course_name, course.description, course.required_strand, course.minimum_gwa, course_id],
            fetch=False
        )
        
        if result == 0:
            raise HTTPException(status_code=404, detail="Course not found")
        
        return {"message": "Course updated successfully"}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to update course: {str(error)}")

# Delete course
@router.delete("/{course_id}")
async def delete_course(course_id: int):
    try:
        result = execute_query('DELETE FROM courses WHERE course_id = $1', [course_id], fetch=False)
        
        if result == 0:
            raise HTTPException(status_code=404, detail="Course not found")
        
        return {"message": "Course deleted successfully"}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to delete course: {str(error)}")
