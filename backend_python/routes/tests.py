from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
import math
from models.database import execute_query, execute_query_one
from pydantic import BaseModel

router = APIRouter(prefix="/api/tests", tags=["tests"])

# Pydantic models
class TestAttempt(BaseModel):
    user_id: int
    test_id: int
    score: int
    total_questions: int
    time_taken: Optional[int] = None  # in minutes

class QuestionCreate(BaseModel):
    test_id: int
    question_text: str
    question_order: int
    question_type: Optional[str] = "multiple_choice"  # multiple_choice, true_false, short_answer

class OptionCreate(BaseModel):
    question_id: int
    option_text: str
    is_correct: bool
    option_order: int

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

# Get test attempts for a specific test
@router.get("/{test_id}/attempts")
async def get_test_attempts(test_id: int):
    try:
        # Verify test exists
        test = execute_query_one('SELECT test_id FROM tests WHERE test_id = $1', [test_id])
        if not test:
            raise HTTPException(status_code=404, detail="Test not found")
        
        attempts = execute_query("""
            SELECT 
                uta.attempt_id,
                uta.user_id,
                CONCAT(u.first_name, ' ', u.last_name) as full_name,
                u.email,
                uta.score,
                uta.total_questions,
                ROUND((uta.score::float / uta.total_questions * 100)::numeric, 2) as percentage,
                uta.attempt_date,
                uta.time_taken
            FROM user_test_attempts uta
            JOIN users u ON uta.user_id = u.user_id
            WHERE uta.test_id = $1
            ORDER BY uta.attempt_date DESC
        """, [test_id])
        
        return {
            "attempts": attempts,
            "total_attempts": len(attempts)
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch test attempts: {str(error)}")

# Submit test attempt (record test results)
@router.post("/{test_id}/submit", status_code=201)
async def submit_test_attempt(test_id: int, attempt: TestAttempt):
    try:
        # Verify test exists
        test = execute_query_one('SELECT test_id FROM tests WHERE test_id = $1', [test_id])
        if not test:
            raise HTTPException(status_code=404, detail="Test not found")
        
        # Verify user exists
        user = execute_query_one('SELECT user_id FROM users WHERE user_id = $1', [attempt.user_id])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Insert test attempt
        result = execute_query_one(
            """INSERT INTO user_test_attempts (user_id, test_id, score, total_questions, time_taken) 
               VALUES ($1, $2, $3, $4, $5) RETURNING attempt_id""",
            [attempt.user_id, test_id, attempt.score, attempt.total_questions, attempt.time_taken]
        )
        
        return {
            "message": "Test attempt recorded successfully",
            "attempt_id": result['attempt_id']
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to record test attempt: {str(error)}")
@router.post("/{test_id}/submit", status_code=201)
async def submit_test_attempt(test_id: int, attempt: TestAttempt):
    try:
        # Verify test exists
        test = execute_query_one('SELECT test_id FROM tests WHERE test_id = $1', [test_id])
        if not test:
            raise HTTPException(status_code=404, detail="Test not found")
        
        # Verify user exists
        user = execute_query_one('SELECT user_id FROM users WHERE user_id = $1', [attempt.user_id])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Insert test attempt
        result = execute_query_one(
            """INSERT INTO user_test_attempts (user_id, test_id, score, total_questions, time_taken) 
               VALUES ($1, $2, $3, $4, $5) RETURNING attempt_id""",
            [attempt.user_id, test_id, attempt.score, attempt.total_questions, attempt.time_taken]
        )
        
        return {
            "message": "Test attempt recorded successfully",
            "attempt_id": result['attempt_id']
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to record test attempt: {str(error)}")

# ==================== QUESTION MANAGEMENT ====================

# Get all questions with pagination and search
@router.get("/questions/list/all")
async def get_questions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(""),
    test_id: Optional[int] = Query(None)
):
    try:
        offset = (page - 1) * limit
        
        query = """SELECT 
            q.question_id,
            q.test_id,
            t.test_name,
            q.question_text,
            q.question_order,
            q.question_type,
            (SELECT COUNT(*) FROM options WHERE question_id = q.question_id) as option_count,
            q.created_at
        FROM questions q
        JOIN tests t ON q.test_id = t.test_id
        WHERE 1=1"""
        
        count_query = "SELECT COUNT(*) as total FROM questions WHERE 1=1"
        params = []
        count_params = []
        param_index = 1
        
        # Add search filter
        if search:
            search_param = f"%{search}%"
            query += f" AND (q.question_text ILIKE ${param_index} OR t.test_name ILIKE ${param_index + 1})"
            count_query += f" AND (question_text ILIKE ${param_index} OR test_id IN (SELECT test_id FROM tests WHERE test_name ILIKE ${param_index + 1}))"
            params.extend([search_param, search_param])
            count_params.extend([search_param, search_param])
            param_index += 2
        
        # Add test filter
        if test_id:
            query += f" AND q.test_id = ${param_index}"
            count_query += f" AND test_id = ${param_index}"
            params.append(test_id)
            count_params.append(test_id)
            param_index += 1
        
        query += f" ORDER BY q.test_id, q.question_order LIMIT ${param_index} OFFSET ${param_index + 1}"
        params.extend([limit, offset])
        
        questions = execute_query(query, params)
        count_result = execute_query_one(count_query, count_params)
        total = int(count_result['total'])
        
        return {
            "questions": questions,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": math.ceil(total / limit)
            }
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch questions: {str(error)}")

# Get question with all options
@router.get("/questions/{question_id}")
async def get_question(question_id: int):
    try:
        question = execute_query_one('SELECT * FROM questions WHERE question_id = $1', [question_id])
        
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        options = execute_query(
            'SELECT * FROM options WHERE question_id = $1 ORDER BY option_order',
            [question_id]
        )
        
        question_dict = dict(question)
        question_dict['options'] = options
        
        return question_dict
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to fetch question: {str(error)}")

# Create question
@router.post("/questions", status_code=201)
async def create_question(question: QuestionCreate):
    try:
        # Verify test exists
        test = execute_query_one('SELECT test_id FROM tests WHERE test_id = $1', [question.test_id])
        if not test:
            raise HTTPException(status_code=404, detail="Test not found")
        
        result = execute_query_one(
            """INSERT INTO questions (test_id, question_text, question_order, question_type)
               VALUES ($1, $2, $3, $4) RETURNING question_id""",
            [question.test_id, question.question_text, question.question_order, question.question_type]
        )
        
        return {
            "message": "Question created successfully",
            "question_id": result['question_id']
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to create question: {str(error)}")

# Delete question
@router.delete("/questions/{question_id}")
async def delete_question(question_id: int):
    try:
        # First delete all options for this question
        execute_query('DELETE FROM options WHERE question_id = $1', [question_id], fetch=False)
        
        # Then delete the question
        result = execute_query('DELETE FROM questions WHERE question_id = $1', [question_id], fetch=False)
        
        if result == 0:
            raise HTTPException(status_code=404, detail="Question not found")
        
        return {"message": "Question deleted successfully"}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to delete question: {str(error)}")

# Create option for a question
@router.post("/questions/{question_id}/options", status_code=201)
async def create_option(question_id: int, option: OptionCreate):
    try:
        # Verify question exists
        question = execute_query_one('SELECT question_id FROM questions WHERE question_id = $1', [question_id])
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        result = execute_query_one(
            """INSERT INTO options (question_id, option_text, is_correct, option_order)
               VALUES ($1, $2, $3, $4) RETURNING option_id""",
            [question_id, option.option_text, option.is_correct, option.option_order]
        )
        
        return {
            "message": "Option created successfully",
            "option_id": result['option_id']
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to create option: {str(error)}")

# Delete option
@router.delete("/options/{option_id}")
async def delete_option(option_id: int):
    try:
        result = execute_query('DELETE FROM options WHERE option_id = $1', [option_id], fetch=False)
        
        if result == 0:
            raise HTTPException(status_code=404, detail="Option not found")
        
        return {"message": "Option deleted successfully"}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to delete option: {str(error)}")
