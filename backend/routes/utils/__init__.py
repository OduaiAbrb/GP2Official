"""Utility routes."""

from fastapi import APIRouter, Depends
from fastapi import HTTPException

from utils.cache import CacheManager
from routes.auth import get_current_user

router = APIRouter()


@router.get("/cache/stats")
async def get_cache_stats():
    """Get Redis cache statistics."""
    return await CacheManager.get_cache_stats()
