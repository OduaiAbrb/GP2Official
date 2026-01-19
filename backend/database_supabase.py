"""Supabase database connection adapter."""

import asyncio
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
import asyncpg
from config import settings

logger = logging.getLogger(__name__)

# Global database pool
pool: Optional[asyncpg.Pool] = None


async def init_supabase_db():
    """Initialize Supabase PostgreSQL connection pool."""
    global pool
    
    print(f"[SUPABASE INIT] URL={'SET' if settings.supabase_url else 'NOT SET'}, SERVICE_KEY={'SET' if settings.supabase_service_key else 'NOT SET'}")
    
    if not settings.supabase_url or not settings.supabase_service_key:
        print("[SUPABASE ERROR] Missing Supabase URL or Service Key!")
        logger.error("Supabase URL and Service Key are required")
        raise ValueError("Missing Supabase configuration")
    
    try:
        # Convert Supabase API URL to PostgreSQL connection string
        # From: https://qscbybwxuybptijwdyvc.supabase.co
        # To: postgresql://postgres:[password]@db.qscbybwxuybptijwdyvc.supabase.co:5432/postgres
        
        # Extract project ID from Supabase URL
        import re
        url_match = re.search(r'https://([^.]+)\.supabase\.co', settings.supabase_url)
        if not url_match:
            raise ValueError(f"Invalid Supabase URL format: {settings.supabase_url}")
        
        project_id = url_match.group(1)
        
        # For now, use service key as password (this is a common pattern for server-side connections)
        # In production, you'd typically have a dedicated database password
        database_url = f"postgresql://postgres.{project_id}:{settings.supabase_service_key}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
        
        print(f"[SUPABASE] Using connection string: postgresql://postgres.{project_id}:***@aws-0-us-west-1.pooler.supabase.com:6543/postgres")
        
        # Create connection pool
        pool = await asyncpg.create_pool(
            database_url,
            min_size=settings.db_min_connections,
            max_size=settings.db_max_connections,
            command_timeout=settings.db_connect_timeout,
            server_settings={
                'application_name': 'gp2official',
                'search_path': 'public'
            }
        )
        
        # Test connection
        async with pool.acquire() as conn:
            await conn.execute('SELECT 1')
            
        logger.info("Connected to Supabase PostgreSQL database")
        
    except Exception as e:
        logger.error(f"Failed to connect to Supabase: {e}")
        raise


async def close_supabase_db():
    """Close Supabase database connection pool."""
    global pool
    if pool:
        await pool.close()
        logger.info("Closed Supabase database connection")


class SupabaseRepository:
    """Base repository class for Supabase operations."""
    
    def __init__(self, table_name: str):
        self.table_name = table_name
    
    async def _execute_query(self, query: str, *args):
        """Execute a query and return results."""
        async with pool.acquire() as conn:
            return await conn.fetch(query, *args)
    
    async def _execute_single(self, query: str, *args):
        """Execute a query and return single result."""
        async with pool.acquire() as conn:
            return await conn.fetchrow(query, *args)
    
    async def _execute_command(self, query: str, *args):
        """Execute a command (INSERT/UPDATE/DELETE)."""
        async with pool.acquire() as conn:
            return await conn.execute(query, *args)
    
    async def find_by_id(self, id: str, organization: str = None) -> Optional[Dict]:
        """Find record by ID."""
        if organization:
            query = f"SELECT * FROM {self.table_name} WHERE id = $1 AND organization = $2"
            row = await self._execute_single(query, id, organization)
        else:
            query = f"SELECT * FROM {self.table_name} WHERE id = $1"
            row = await self._execute_single(query, id)
        
        return dict(row) if row else None
    
    async def find_all(self, organization: str = None) -> List[Dict]:
        """Find all records for organization."""
        if organization:
            query = f"SELECT * FROM {self.table_name} WHERE organization = $1 ORDER BY created_at DESC"
            rows = await self._execute_query(query, organization)
        else:
            query = f"SELECT * FROM {self.table_name} ORDER BY created_at DESC"
            rows = await self._execute_query(query)
        
        return [dict(row) for row in rows]
    
    async def create(self, data: Dict) -> Dict:
        """Create a new record."""
        # Add timestamps
        now = datetime.utcnow()
        data['created_at'] = now
        data['updated_at'] = now
        
        # Generate column names and placeholders
        columns = list(data.keys())
        placeholders = [f"${i+1}" for i in range(len(columns))]
        
        query = f"""
            INSERT INTO {self.table_name} ({', '.join(columns)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        row = await self._execute_single(query, *data.values())
        return dict(row)
    
    async def update(self, id: str, data: Dict, organization: str = None) -> Optional[Dict]:
        """Update a record by ID."""
        # Add updated timestamp
        data['updated_at'] = datetime.utcnow()
        
        # Generate SET clause
        set_clauses = [f"{key} = ${i+2}" for i, key in enumerate(data.keys())]
        
        if organization:
            query = f"""
                UPDATE {self.table_name} 
                SET {', '.join(set_clauses)}
                WHERE id = $1 AND organization = ${len(data)+2}
                RETURNING *
            """
            row = await self._execute_single(query, id, *data.values(), organization)
        else:
            query = f"""
                UPDATE {self.table_name} 
                SET {', '.join(set_clauses)}
                WHERE id = $1
                RETURNING *
            """
            row = await self._execute_single(query, id, *data.values())
        
        return dict(row) if row else None
    
    async def delete(self, id: str, organization: str = None) -> bool:
        """Delete a record by ID."""
        if organization:
            query = f"DELETE FROM {self.table_name} WHERE id = $1 AND organization = $2"
            result = await self._execute_command(query, id, organization)
        else:
            query = f"DELETE FROM {self.table_name} WHERE id = $1"
            result = await self._execute_command(query, id)
        
        return result == "DELETE 1"


class SupabaseUserRepository(SupabaseRepository):
    """User repository for Supabase."""
    
    def __init__(self):
        super().__init__("users")
    
    async def find_by_email(self, email: str) -> Optional[Dict]:
        """Find user by email."""
        query = "SELECT * FROM users WHERE email = $1"
        row = await self._execute_single(query, email)
        return dict(row) if row else None


class SupabaseProjectRepository(SupabaseRepository):
    """Project repository for Supabase."""
    
    def __init__(self):
        super().__init__("projects")
    
    async def find_by_owner(self, owner_id: str, organization: str) -> List[Dict]:
        """Find projects by owner."""
        query = "SELECT * FROM projects WHERE owner_id = $1 AND organization = $2 ORDER BY created_at DESC"
        rows = await self._execute_query(query, owner_id, organization)
        return [dict(row) for row in rows]


class SupabaseRequirementRepository(SupabaseRepository):
    """Requirement repository for Supabase."""
    
    def __init__(self):
        super().__init__("requirements")
    
    async def find_by_project(self, project_id: str) -> List[Dict]:
        """Find requirements by project."""
        query = "SELECT * FROM requirements WHERE project_id = $1 ORDER BY created_at"
        rows = await self._execute_query(query, project_id)
        return [dict(row) for row in rows]


class SupabaseTaskRepository(SupabaseRepository):
    """Task repository for Supabase."""
    
    def __init__(self):
        super().__init__("tasks")
    
    async def find_by_project(self, project_id: str) -> List[Dict]:
        """Find tasks by project."""
        query = "SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at"
        rows = await self._execute_query(query, project_id)
        return [dict(row) for row in rows]
    
    async def find_by_status(self, project_id: str, status: str) -> List[Dict]:
        """Find tasks by status."""
        query = "SELECT * FROM tasks WHERE project_id = $1 AND status = $2 ORDER BY created_at"
        rows = await self._execute_query(query, project_id, status)
        return [dict(row) for row in rows]


# Repository instances (will be used by services)
def get_user_repository():
    return SupabaseUserRepository()

def get_project_repository():
    return SupabaseProjectRepository()

def get_requirement_repository():
    return SupabaseRequirementRepository()

def get_task_repository():
    return SupabaseTaskRepository()
