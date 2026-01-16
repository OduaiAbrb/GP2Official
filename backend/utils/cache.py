"""Redis caching utilities."""

import json
import pickle
import hashlib
from typing import Any, Optional, Dict, List, Union
from functools import wraps
import redis.asyncio as redis
from config import settings
import logging

logger = logging.getLogger(__name__)

# Global Redis client
redis_client: Optional[redis.Redis] = None


async def init_redis():
    """Initialize Redis connection."""
    global redis_client
    
    if not settings.redis_url:
        logger.warning("Redis URL not configured, caching disabled")
        return
    
    try:
        redis_client = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            retry_on_timeout=True,
            retry_on_error=[redis.BusyLoadingError, redis.ConnectionError, redis.TimeoutError],
            max_connections=20
        )
        
        # Test connection
        await redis_client.ping()
        logger.info("Connected to Redis cache")
        
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        redis_client = None


async def close_redis():
    """Close Redis connection."""
    global redis_client
    if redis_client:
        await redis_client.aclose()
        logger.info("Closed Redis connection")


def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate a consistent cache key from arguments."""
    key_data = f"{prefix}:{':'.join(str(arg) for arg in args)}"
    if kwargs:
        sorted_kwargs = sorted(kwargs.items())
        kwargs_str = ':'.join(f"{k}={v}" for k, v in sorted_kwargs)
        key_data += f":{kwargs_str}"
    
    # Hash long keys to avoid Redis key length limits
    if len(key_data) > 250:
        key_hash = hashlib.md5(key_data.encode()).hexdigest()
        return f"{prefix}:hash:{key_hash}"
    
    return key_data


async def get_cached(key: str) -> Optional[Any]:
    """Get value from cache."""
    if not redis_client:
        return None
    
    try:
        cached_data = await redis_client.get(key)
        if cached_data:
            # Try to deserialize as JSON first, then pickle
            try:
                return json.loads(cached_data)
            except (json.JSONDecodeError, TypeError):
                try:
                    return pickle.loads(cached_data.encode('latin1'))
                except (pickle.UnpicklingError, TypeError):
                    logger.warning(f"Failed to deserialize cached data for key: {key}")
                    return None
        return None
    except Exception as e:
        logger.warning(f"Cache get error for key {key}: {e}")
        return None


async def set_cached(key: str, value: Any, ttl: int = None) -> bool:
    """Set value in cache with optional TTL."""
    if not redis_client:
        return False
    
    try:
        # Try JSON serialization first, fallback to pickle
        try:
            serialized_value = json.dumps(value, default=str)
        except (TypeError, ValueError):
            serialized_value = pickle.dumps(value).decode('latin1')
        
        ttl = ttl or settings.cache_ttl
        await redis_client.setex(key, ttl, serialized_value)
        return True
        
    except Exception as e:
        logger.warning(f"Cache set error for key {key}: {e}")
        return False


async def delete_cached(pattern: str) -> int:
    """Delete cached values matching pattern."""
    if not redis_client:
        return 0
    
    try:
        keys = await redis_client.keys(pattern)
        if keys:
            return await redis_client.delete(*keys)
        return 0
    except Exception as e:
        logger.warning(f"Cache delete error for pattern {pattern}: {e}")
        return 0


async def invalidate_project_cache(project_id: str):
    """Invalidate all cache entries for a project."""
    patterns = [
        f"project:{project_id}:*",
        f"requirements:{project_id}:*",
        f"tasks:{project_id}:*",
        f"diagrams:{project_id}:*",
        f"artifacts:{project_id}:*"
    ]
    
    total_deleted = 0
    for pattern in patterns:
        deleted = await delete_cached(pattern)
        total_deleted += deleted
    
    logger.info(f"Invalidated {total_deleted} cache entries for project {project_id}")
    return total_deleted


def cached(ttl: int = None, key_prefix: str = "default"):
    """Decorator for caching function results."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = generate_cache_key(f"{key_prefix}:{func.__name__}", *args, **kwargs)
            
            # Try to get from cache
            cached_result = await get_cached(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            if result is not None:
                await set_cached(cache_key, result, ttl)
                logger.debug(f"Cached result for {cache_key}")
            
            return result
        return wrapper
    return decorator


class CacheManager:
    """Centralized cache management."""
    
    @staticmethod
    async def warm_up_project_cache(project_id: str, organization: str):
        """Pre-load frequently accessed project data."""
        try:
            from repositories.project_repository import ProjectRepository
            from repositories.requirement_repository import RequirementRepository
            from repositories.task_repository import TaskRepository
            
            project_repo = ProjectRepository()
            req_repo = RequirementRepository()
            task_repo = TaskRepository()
            
            # Cache project data
            project = await project_repo.get_by_id(project_id, organization)
            if project:
                project_key = generate_cache_key("project", project_id)
                await set_cached(project_key, project.dict())
            
            # Cache requirements
            requirements = await req_repo.get_by_project_id(project_id)
            req_key = generate_cache_key("requirements", project_id)
            await set_cached(req_key, [req.dict() for req in requirements])
            
            # Cache tasks
            tasks = await task_repo.get_by_project_id(project_id)
            task_key = generate_cache_key("tasks", project_id)
            await set_cached(task_key, [task.dict() for task in tasks])
            
            logger.info(f"Warmed up cache for project {project_id}")
            
        except Exception as e:
            logger.warning(f"Cache warm-up failed for project {project_id}: {e}")
    
    @staticmethod
    async def get_cache_stats() -> Dict[str, Any]:
        """Get Redis cache statistics."""
        if not redis_client:
            return {"status": "disabled", "reason": "Redis not configured"}
        
        try:
            info = await redis_client.info()
            return {
                "status": "active",
                "connected_clients": info.get("connected_clients", 0),
                "used_memory": info.get("used_memory_human", "0B"),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "total_commands_processed": info.get("total_commands_processed", 0),
                "uptime_in_seconds": info.get("uptime_in_seconds", 0)
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    @staticmethod
    async def flush_all_cache():
        """Clear all cache data - use with caution."""
        if not redis_client:
            return False
        
        try:
            await redis_client.flushdb()
            logger.warning("Flushed all cache data")
            return True
        except Exception as e:
            logger.error(f"Failed to flush cache: {e}")
            return False


# Cache decorator aliases for common use cases
@cached(ttl=300, key_prefix="project")
async def cached_project_data(*args, **kwargs):
    """5-minute cache for project data."""
    pass

@cached(ttl=180, key_prefix="requirements") 
async def cached_requirements_data(*args, **kwargs):
    """3-minute cache for requirements."""
    pass

@cached(ttl=60, key_prefix="tasks")
async def cached_tasks_data(*args, **kwargs):
    """1-minute cache for tasks."""
    pass
