# PostgreSQL Setup Guide for Course Recommendation System

## Prerequisites

- PostgreSQL 12.0 or higher installed
- Node.js 16.0 or higher
- npm 8.0 or higher

## Installation Steps

### 1. Install PostgreSQL

#### Windows:
- Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)
- Run the installer
- Remember the password you set for the `postgres` user
- Accept default port 5432

#### macOS:
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database and User

Connect to PostgreSQL and run:

```bash
# Windows/macOS/Linux (from psql terminal):
CREATE DATABASE course_recommendation_system;

# Optional: Create a dedicated user (recommended for security)
CREATE USER capstone WITH PASSWORD 'secure_password_here';
ALTER ROLE capstone WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE course_recommendation_system TO capstone;
```

Or use command line:
```bash
# macOS/Linux:
createdb course_recommendation_system

# Windows (in PostgreSQL command line):
psql -U postgres -c "CREATE DATABASE course_recommendation_system;"
```

### 3. Update Environment Variables

Create a `.env` file in the backend folder:

```bash
cd backend
copy .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=course_recommendation_system
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# If using a custom user:
# DB_USER=capstone
# DB_PASSWORD=secure_password_here

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000
```

### 4. Install Dependencies

```bash
npm install
```

This will install:
- **pg**: PostgreSQL client
- **express**: Web framework
- **cors**: Cross-Origin Resource Sharing
- **helmet**: Security headers
- **bcrypt**: Password hashing
- **express-validator**: Input validation
- **jsonwebtoken**: JWT authentication
- **dotenv**: Environment variables

### 5. Start the Server

**Development Mode (with auto-restart):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

You should see:
```
✅ Database connected successfully
✅ Database tables initialized successfully
🚀 Server running on port 5000
📱 Environment: development
🌐 CORS enabled for: http://localhost:3000
```

## Verify Installation

### Test Database Connection

```bash
# In a new terminal:
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-01-20T10:30:45.123Z",
  "uptime": 5.234,
  "environment": "development"
}
```

### Check Database Tables

Connect to PostgreSQL:
```bash
# macOS/Linux:
psql course_recommendation_system

# Windows:
psql -U postgres -d course_recommendation_system
```

List tables:
```sql
\dt
```

You should see:
- users
- courses
- tests
- questions
- options
- recommendations
- user_responses

### Test API Endpoint

Create a test user:
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "strand": "STEM",
    "gwa": 88.5
  }'
```

Get all users:
```bash
curl http://localhost:5000/api/users
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module 'pg'" | Run `npm install` |
| "ECONNREFUSED 127.0.0.1:5432" | PostgreSQL not running. Start service |
| "password authentication failed" | Check DB_PASSWORD in .env file |
| "database does not exist" | Run `createdb course_recommendation_system` |
| "permission denied" | Check PostgreSQL user permissions |
| "FATAL: remaining connection slots reserved" | Restart PostgreSQL service |

## PostgreSQL Management

### Start/Stop Services

**Windows:**
- Use Services app (services.msc)
- Or: `net start PostgreSQL15` / `net stop PostgreSQL15`

**macOS:**
```bash
brew services start postgresql@15
brew services stop postgresql@15
```

**Linux:**
```bash
sudo systemctl start postgresql
sudo systemctl stop postgresql
sudo systemctl status postgresql
```

### Backup Database

```bash
# All databases
pg_dump -U postgres -F custom -f backup.dump course_recommendation_system

# Restore from backup
pg_restore -U postgres -d course_recommendation_system backup.dump
```

### Connect to Database

```bash
psql -U postgres -d course_recommendation_system -h localhost
```

Common psql commands:
- `\dt` - List tables
- `\d table_name` - Show table structure
- `\du` - List users
- `SELECT * FROM users;` - Query data
- `\q` - Exit

## Configuration Details

### Database Configuration (in code)

The `backend/models/database.js` file configures:
- Connection pooling: max 10 connections
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds
- Automatic table creation on startup

### Security Considerations

1. **Strong Passwords**: Use secure passwords for PostgreSQL users
2. **Environment Variables**: Never commit `.env` file to version control
3. **Connection Pooling**: Limits number of concurrent connections
4. **Input Validation**: All endpoints validate user input
5. **Password Hashing**: User passwords hashed with bcrypt

## Environment Variables Reference

```env
# Database
DB_HOST              # PostgreSQL host (default: localhost)
DB_PORT              # PostgreSQL port (default: 5432)
DB_NAME              # Database name
DB_USER              # Database user
DB_PASSWORD          # Database password

# Server
PORT                 # API port (default: 5000)
NODE_ENV             # Environment (development/production)
FRONTEND_URL         # Frontend URL for CORS

# Security
JWT_SECRET           # Secret for JWT signing
SESSION_SECRET       # Secret for sessions

# CORS
ALLOWED_ORIGINS      # Comma-separated list of allowed origins
```

## Next Steps

1. **Connect Frontend**: Update React app to use `http://localhost:5000/api` base URL
2. **Create Test Data**: Use API endpoints to populate sample data
3. **Development**: Start building features with hot-reload (`npm run dev`)
4. **Production Deploy**: Set `NODE_ENV=production` and use secure credentials

## Support

For PostgreSQL issues:
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Documentation](https://node-postgres.com/)

For API issues:
- Check server logs in terminal
- Verify database connection with `npm run dev`
- Test endpoints with curl or Postman