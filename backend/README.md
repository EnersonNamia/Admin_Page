# Course Recommendation System - Backend API

A comprehensive Node.js/Express backend API for the Course Recommendation System Admin Panel. This backend provides RESTful endpoints for managing users, courses, tests, recommendations, and analytics.

## Features

- **User Management**: CRUD operations for student users with authentication
- **Course Management**: Full course catalog management with strand-based filtering
- **Test Management**: Create and manage assessment tests with questions and options
- **Recommendation Engine**: Generate and track course recommendations
- **Analytics Dashboard**: Comprehensive reporting and analytics endpoints
- **Database Integration**: MySQL database with proper relationships and constraints
- **Input Validation**: Express-validator for request validation
- **Security**: Helmet.js for security headers, CORS configuration
- **Error Handling**: Comprehensive error handling and logging

## Technology Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js 4.18+
- **Database**: MySQL 8.0+ with mysql2 driver
- **Validation**: express-validator
- **Security**: helmet, cors, bcrypt
- **Authentication**: JWT (jsonwebtoken)
- **Environment**: dotenv

## Quick Start

### 1. Prerequisites

- Node.js 16.0 or higher
- npm 8.0 or higher
- MySQL 8.0 or higher

### 2. Installation

```bash
# Clone the repository and navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your environment variables in .env
```

### 3. Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE course_recommendation_system;
```

2. Update your `.env` file with database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=course_recommendation_system
DB_USER=your_username
DB_PASSWORD=your_password
```

3. The database tables will be created automatically when you start the server.

### 4. Start the Server

```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000` by default.

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Users
- `GET /api/users` - Get all users with pagination and search
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/stats/overview` - User statistics

### Courses
- `GET /api/courses` - Get all courses with pagination and filters
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `GET /api/courses/stats/overview` - Course statistics
- `GET /api/courses/strand/:strand` - Get courses by strand

### Tests
- `GET /api/tests` - Get all tests with pagination
- `GET /api/tests/:id` - Get test with questions and options
- `POST /api/tests` - Create new test with questions
- `PUT /api/tests/:id` - Update test
- `DELETE /api/tests/:id` - Delete test
- `GET /api/tests/stats/overview` - Test statistics
- `GET /api/tests/:id/questions` - Get questions for a test
- `POST /api/tests/:id/questions` - Add question to test
- `DELETE /api/tests/questions/:questionId` - Delete question

### Recommendations
- `GET /api/recommendations` - Get all recommendations with filters
- `GET /api/recommendations/:id` - Get recommendation by ID
- `POST /api/recommendations` - Create new recommendation
- `PUT /api/recommendations/:id/status` - Update recommendation status
- `DELETE /api/recommendations/:id` - Delete recommendation
- `GET /api/recommendations/stats/overview` - Recommendation statistics
- `GET /api/recommendations/user/:userId` - Get user recommendations
- `GET /api/recommendations/course/:courseId` - Get course recommendations
- `POST /api/recommendations/generate` - Generate recommendations for user

### Analytics
- `GET /api/analytics/system/overview` - System overview statistics
- `GET /api/analytics/users/analytics` - User analytics and trends
- `GET /api/analytics/courses/analytics` - Course analytics and popularity
- `GET /api/analytics/recommendations/analytics` - Recommendation analytics
- `GET /api/analytics/tests/analytics` - Test analytics and complexity
- `GET /api/analytics/activity/timeline` - System activity timeline
- `GET /api/analytics/performance/metrics` - Performance metrics

## Database Schema

### Tables

1. **users** - Student user profiles
   - user_id (PK), full_name, email, password, strand, gwa, created_at, updated_at

2. **courses** - Available courses
   - course_id (PK), course_name, description, required_strand, minimum_gwa, created_at, updated_at

3. **tests** - Assessment tests
   - test_id (PK), test_name, description, created_at, updated_at

4. **questions** - Test questions
   - question_id (PK), test_id (FK), question_text, trait_tag, question_order, created_at

5. **options** - Question options
   - option_id (PK), question_id (FK), option_text, trait_impact, option_order, created_at

6. **recommendations** - Course recommendations
   - recommendation_id (PK), user_id (FK), course_id (FK), confidence_score, reasoning, status, created_at, updated_at

7. **user_responses** - User test responses
   - response_id (PK), user_id (FK), question_id (FK), option_id (FK), created_at

## Request/Response Examples

### Create User
```bash
POST /api/users
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "strand": "STEM",
  "gwa": 88.5
}
```

### Get Users with Pagination
```bash
GET /api/users?page=1&limit=10&search=john&strand=STEM
```

### Create Course
```bash
POST /api/courses
Content-Type: application/json

{
  "course_name": "Computer Science",
  "description": "Bachelor of Science in Computer Science",
  "required_strand": "STEM",
  "minimum_gwa": 85.0
}
```

### Generate Recommendations
```bash
POST /api/recommendations/generate
Content-Type: application/json

{
  "user_id": 1
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (duplicate entries)
- `500` - Internal Server Error

## Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=course_recommendation_system
DB_USER=root
DB_PASSWORD=your_password

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your_jwt_secret

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000
```

## Development

### Project Structure
```
backend/
├── models/
│   └── database.js          # Database connection and schema
├── routes/
│   ├── users.js            # User management endpoints
│   ├── courses.js          # Course management endpoints
│   ├── tests.js            # Test management endpoints
│   ├── recommendations.js  # Recommendation endpoints
│   └── analytics.js        # Analytics endpoints
├── server.js               # Main application file
├── package.json           # Dependencies and scripts
├── .env.example          # Environment template
└── README.md             # This file
```

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (placeholder)

## Security Features

- **Input Validation**: All endpoints validate input using express-validator
- **Password Hashing**: User passwords are hashed using bcrypt
- **CORS Protection**: Configured CORS for frontend integration
- **Security Headers**: Helmet.js for security headers
- **SQL Injection Protection**: Prepared statements with mysql2
- **Error Handling**: Sanitized error messages in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please create an issue in the repository or contact the development team.

---

**Note**: This backend is designed to work with the Course Recommendation System Admin Panel frontend. Make sure both applications are configured with compatible settings.