# Quick Start Guide

## Start the Python Backend

### Option 1: Using the start script
```bash
cd backend_python
start.bat
```

### Option 2: Using Python directly
```bash
cd backend_python
python main.py
```

### Option 3: Using Uvicorn
```bash
cd backend_python  
uvicorn main:app --reload --port 5000
```

## Server Info

- **URL:** http://localhost:5000
- **API Docs:** http://localhost:5000/docs (Swagger UI)
- **Health Check:** http://localhost:5000/health

## Stop the Server

Press `CTRL+C` in the terminal

## Testing the API

```bash
# Health check
curl http://localhost:5000/health

# Get all users
curl http://localhost:5000/api/users/

# Get user statistics
curl http://localhost:5000/api/users/stats/overview
```

## Common Issues

### Port Already in Use
If you get "address already in use", stop the Node.js backend first:
```bash
# In PowerShell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Database Connection Failed
- Make sure PostgreSQL is running
- Check credentials in `.env` file
- Verify database exists: `coursepro_db`
