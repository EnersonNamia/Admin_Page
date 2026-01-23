from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from models.database import get_db_pool, test_connection, close_all_connections
from routes import users, courses, tests, recommendations, analytics, feedback

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Course Recommendation System API",
    description="Backend API for Course Recommendation System Admin Panel",
    version="1.0.0"
)

# Configure CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(tests.router)
app.include_router(recommendations.router)
app.include_router(analytics.router)
app.include_router(feedback.router)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    try:
        get_db_pool()
        if test_connection():
            print("✅ Backend server started successfully")
            print(f"   Environment: {os.getenv('ENVIRONMENT', 'development')}")
            print(f"   CORS enabled for: {', '.join(allowed_origins)}")
    except Exception as error:
        print(f"❌ Failed to start server: {error}")
        raise error

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown"""
    close_all_connections()
    print("✅ Server shutdown complete")

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "Course Recommendation System API",
        "status": "running",
        "version": "1.0.0"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        if test_connection():
            return {"status": "healthy", "database": "connected"}
        else:
            raise HTTPException(status_code=503, detail="Database connection failed")
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"Health check failed: {str(error)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
