import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL connection pool
connection_pool = None

def get_db_pool():
    """Initialize and return the database connection pool"""
    global connection_pool
    
    if connection_pool is None:
        try:
            connection_pool = psycopg2.pool.SimpleConnectionPool(
                1, 20,  # min and max connections
                host=os.getenv('DB_HOST', 'localhost'),
                port=os.getenv('DB_PORT', '5432'),
                database=os.getenv('DB_NAME', 'coursepro_db'),
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASSWORD')
            )
            print('✅ PostgreSQL database connected successfully')
            print(f'   Connected to: {os.getenv("DB_HOST")}:{os.getenv("DB_PORT")}/{os.getenv("DB_NAME")}')
        except Exception as error:
            print(f'❌ Database connection failed: {error}')
            print('   Make sure PostgreSQL is running and credentials are correct in .env file')
            raise error
    
    return connection_pool

def get_db_connection():
    """Get a connection from the pool"""
    pool = get_db_pool()
    return pool.getconn()

def release_db_connection(conn):
    """Return a connection to the pool"""
    pool = get_db_pool()
    pool.putconn(conn)

def execute_query(query, params=None, fetch=True):
    """Execute a database query"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        # Convert $1, $2 style to %s style for psycopg2
        if params:
            # Replace $1, $2, etc with %s
            import re
            query = re.sub(r'\$\d+', '%s', query)
        cursor.execute(query, params or ())
        
        if fetch:
            result = cursor.fetchall()
            cursor.close()
            return result
        else:
            conn.commit()
            cursor.close()
            return cursor.rowcount
    except Exception as error:
        if conn:
            conn.rollback()
        raise error
    finally:
        if conn:
            release_db_connection(conn)

def execute_query_one(query, params=None):
    """Execute a query and return one result"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        # Convert $1, $2 style to %s style for psycopg2
        if params:
            import re
            query = re.sub(r'\$\d+', '%s', query)
        cursor.execute(query, params or ())
        
        # Commit for INSERT, UPDATE, DELETE statements
        if any(keyword in query.upper() for keyword in ['INSERT', 'UPDATE', 'DELETE']):
            conn.commit()
        
        result = cursor.fetchone()
        cursor.close()
        return result
    except Exception as error:
        if conn:
            conn.rollback()
        raise error
    finally:
        if conn:
            release_db_connection(conn)

def test_connection():
    """Test database connection"""
    try:
        result = execute_query('SELECT 1 as test')
        return True
    except Exception as error:
        print(f'Connection test failed: {error}')
        return False

def close_all_connections():
    """Close all database connections"""
    global connection_pool
    if connection_pool:
        connection_pool.closeall()
        print('Database pool closed')
