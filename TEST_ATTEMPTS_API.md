# Test Attempts API Documentation

## Overview
The system now tracks all test attempts taken by users. This allows admins to view the complete test history for each student.

## Database Schema

### user_test_attempts Table
```sql
CREATE TABLE user_test_attempts (
    attempt_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    test_id INTEGER NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    attempt_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    time_taken INTEGER,  -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### 1. Submit Test Attempt (Record Test Results)
**Endpoint:** `POST /api/tests/{test_id}/submit`

**Purpose:** Records when a user completes a test

**Request Body:**
```json
{
    "user_id": 1,
    "test_id": 1,
    "score": 8,
    "total_questions": 10,
    "time_taken": 15
}
```

**Response:**
```json
{
    "message": "Test attempt recorded successfully",
    "attempt_id": 1
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/tests/1/submit \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "test_id": 1,
    "score": 8,
    "total_questions": 10,
    "time_taken": 15
  }'
```

---

### 2. Get Test Attempts (View All Attempts for a Test)
**Endpoint:** `GET /api/tests/{test_id}/attempts`

**Purpose:** View all user attempts for a specific test

**Response:**
```json
{
    "attempts": [
        {
            "attempt_id": 1,
            "user_id": 1,
            "full_name": "John Doe",
            "email": "john@example.com",
            "score": 8,
            "total_questions": 10,
            "percentage": 80.00,
            "attempt_date": "2026-01-23T14:30:00+00:00",
            "time_taken": 15
        }
    ],
    "total_attempts": 1
}
```

---

### 3. Get User Test History (Already Available)
**Endpoint:** `GET /api/users/{user_id}/test-history`

**Purpose:** View all tests taken by a specific user (Admin Panel)

**Response:**
```json
{
    "test_history": [
        {
            "attempt_id": 1,
            "test_id": 1,
            "test_name": "Smart Assessment (Adaptive)",
            "score": 8,
            "total_questions": 10,
            "percentage": 80.00,
            "attempt_date": "2026-01-23T14:30:00+00:00",
            "time_taken": 15
        }
    ],
    "total_tests_taken": 1
}
```

---

## Integration Steps

### For Student App
When a student completes a test, make a POST request to the submit endpoint:

```javascript
// After test completion
const submitTestResult = async (testId, userInfo) => {
    try {
        const response = await fetch(`http://localhost:5000/api/tests/${testId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userInfo.userId,
                test_id: testId,
                score: userInfo.correctAnswers,
                total_questions: userInfo.totalQuestions,
                time_taken: userInfo.timeInMinutes
            })
        });
        
        const data = await response.json();
        console.log('Test attempt recorded:', data);
    } catch (error) {
        console.error('Failed to submit test:', error);
    }
};
```

### For Admin Panel
- Test history is automatically displayed in the User Details modal
- Shows all tests taken by each student
- Displays scores, percentages, and dates

---

## Data Migration

### Importing Existing Test Results
Use the `add_test_attempts.py` script to import historical test data:

1. Edit `backend_python/add_test_attempts.py`
2. Add your test attempt records in the `test_attempts` list
3. Run: `python add_test_attempts.py`

**Example:**
```python
test_attempts = [
    {
        'user_id': 1,
        'test_id': 1,
        'score': 8,
        'total_questions': 10,
        'time_taken': 15,
        'attempt_date': datetime.now() - timedelta(days=1)
    },
    {
        'user_id': 1,
        'test_id': 2,
        'score': 9,
        'total_questions': 10,
        'time_taken': 13,
        'attempt_date': datetime.now()
    }
]
```

---

## Troubleshooting

### Admin doesn't see test history
1. Verify the test was submitted via the POST endpoint
2. Check the `user_test_attempts` table:
   ```sql
   SELECT * FROM user_test_attempts WHERE user_id = 1;
   ```
3. Ensure both user_id and test_id exist in their respective tables

### Test attempts not appearing in admin panel
1. Refresh the browser
2. Check browser console for errors
3. Verify the user details modal API call is working:
   - Open DevTools → Network
   - Click "View Details" for a user
   - Check if `/api/users/{user_id}/test-history` request returns data

---

## Notes
- Test attempts are automatically recorded with timestamp
- Time taken is optional (can be NULL)
- Attempting the same test multiple times creates separate records
- All scores are maintained for historical tracking
