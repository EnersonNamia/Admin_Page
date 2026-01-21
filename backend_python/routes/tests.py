from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
import math
from models.database import execute_query, execute_query_one

router = APIRouter(prefix="/api/tests", tags=["tests"])

# Get all tests with pagination and search
@router.get("/")
async def get_tests(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query("")
):
    try:
        offset = (page - 1) * limit
        
        query = 'SELECT * FROM tests WHERE 1=1'
        count_query = 'SELECT COUNT(*) as total FROM tests WHERE 1=1'
        params = []
        count_params = []
        param_index = 1
        
        # Add search filter
        if search:
            search_param = f"%{search}%"
            query += f" AND test_name ILIKE ${param_index}"
            count_query += f" AND test_name ILIKE ${param_index}"
            params.append(search_param)
            count_params.append(search_param)
            param_index += 1
        
        query += f" ORDER BY test_id DESC LIMIT ${param_index} OFFSET ${param_index + 1}"
        params.extend([limit, offset])
        
        tests = execute_query(query, params)
        count_result = execute_query_one(count_query, count_params)
        total = int(count_result['total'])
        
        return {
            "tests": tests,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": math.ceil(total / limit)
            }
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tests: {str(error)}")

# Get test by ID with questions and options
@router.get("/{test_id}")
async def get_test(test_id: int):
    try:
        test = execute_query_one('SELECT * FROM tests WHERE test_id = $1', [test_id])
        
        if not test:
            raise HTTPException(status_code=404, detail="Test not found")
        
        questions = execute_query(
            'SELECT * FROM questions WHERE test_id = $1 ORDER BY question_order',
            [test_id]
        )
        
        # Get options for each question
        questions_with_options = []
        for question in questions:
            options = execute_query(
                'SELECT * FROM options WHERE question_id = $1 ORDER BY option_order',
                [question['question_id']]
            )
            question_dict = dict(question)
            question_dict['options'] = options
            questions_with_options.append(question_dict)
        
        test_dict = dict(test)
        test_dict['questions'] = questions_with_options
        
        return test_dict
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch test: {str(error)}")

# Delete test
@router.delete("/{test_id}")
async def delete_test(test_id: int):
    try:
        result = execute_query('DELETE FROM tests WHERE test_id = $1', [test_id], fetch=False)
        
        if result == 0:
            raise HTTPException(status_code=404, detail="Test not found")
        
        return {"message": "Test deleted successfully"}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to delete test: {str(error)}")
