# Course Recommendation System - Python/FastAPI Backend

## Overview

This is the Python/FastAPI backend for the Course Recommendation System Admin Panel, migrated from the original Node.js/Express implementation to meet capstone project requirements.

## Tech Stack

- **Framework:** FastAPI 0.109.0
- **Database:** PostgreSQL 14+
- **Language:** Python 3.x
- **Authentication:** JWT with passlib (bcrypt)
- **Server:** Uvicorn

## Project Structure

```
backend_python/
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
├── .env                # Environment variables
├── models/
│   └── database.py     # Database connection and utilities
└── routes/
    ├── users.py        # User management endpoints
    ├── courses.py      # Course management endpoints (to be added)
    ├── tests.py        # Test management endpoints (to be added)
    ├── recommendations.py  # Recommendation endpoints (to be added)
    └── analytics.py    # Analytics endpoints (to be added)
```

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend_python
pip install -r requirements.txt
```

### 2. Configure Environment Variables

The `.env` file is already configured with your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coursepro_db
DB_USER=postgres
DB_PASSWORD=admin123
PORT=5000
```

### 3. Verify Database Connection

Make sure PostgreSQL is running and the database exists:

```bash
# Test connection (optional)
python -c "from models.database import test_connection; test_connection()"
```

### 4. Start the Server

```bash
# Development mode with auto-reload
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --port 5000
```

The server will start on `http://localhost:5000`

## API Endpoints

### Users API (`/api/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/` | Get all users (with pagination) |
| GET | `/api/users/{id}` | Get user by ID |
| POST | `/api/users/` | Create new user |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user |
| GET | `/api/users/stats/overview` | Get user statistics |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API status |
| GET | `/health` | Health check with DB status |

## API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI:** http://localhost:5000/docs
- **ReDoc:** http://localhost:5000/redoc

## Migration Status

### ✅ Completed
- [x] Project structure setup
- [x] Database connection (PostgreSQL)
- [x] Users API routes
- [x] Environment configuration
- [x] CORS middleware
- [x] Main FastAPI application

### 🚧 To Be Completed
- [ ] Courses API routes
- [ ] Tests API routes  
- [ ] Recommendations API routes
- [ ] Analytics API routes
- [ ] JWT authentication middleware
- [ ] Decision Tree algorithm integration
- [ ] Rule-Based Logic implementation

## Database Schema

The Python backend uses the same PostgreSQL database schema as the Node.js version:

- `users` - User information with academic_info (JSONB)
- `courses` - Course catalog
- `tests` - Assessment tests
- `questions` - Test questions
- `options` - Question options with trait impact
- `recommendations` - Generated course recommendations
- `test_attempts` - User test attempts
- `student_answers` - User answers to questions

## Development Notes

### Parameter Binding

PostgreSQL uses `$1`, `$2` syntax for parameter binding (different from Python's `%s` or `?`):

```python
execute_query("SELECT * FROM users WHERE user_id = $1", [user_id])
```

### JSON Fields

Academic info is stored as JSONB in PostgreSQL:

```python
academic_info = {"strand": "STEM", "gwa": 92.5}
query = "INSERT INTO users (..., academic_info) VALUES (..., $1)"
execute_query(query, [str(academic_info).replace("'", '"')])
```

### CORS Configuration

CORS is configured to allow requests from the React frontend:

```python
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Testing

```bash
# Run the server
python main.py

# Test endpoints
curl http://localhost:5000/health
curl http://localhost:5000/api/users/
```

## Frontend Integration

Update your React frontend to point to the Python backend:

```javascript
// In your API configuration
const API_BASE_URL = 'http://localhost:5000';
```

## Troubleshooting

### Port Already in Use

If port 5000 is already in use (by the Node.js backend):

```bash
# Stop Node.js backend first
# Or change the port in .env file
PORT=8000
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
# Check credentials in .env file
# Test connection manually
psql -h localhost -U postgres -d coursepro_db
```

### Import Errors

```bash
# Make sure you're in the backend_python directory
cd backend_python

# Reinstall dependencies
pip install -r requirements.txt
```

## Next Steps

1. Complete remaining route conversions (courses, tests, recommendations, analytics)
2. Implement JWT authentication
3. Add Decision Tree algorithm for course recommendations
4. Implement Rule-Based Logic filtering
5. Add comprehensive error handling
6. Write unit tests
7. Deploy to production

## License

MIT
