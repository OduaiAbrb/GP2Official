"""AI run audit models."""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class AiRun(BaseModel):
    """Persisted AI execution record."""

    id: str = Field(..., alias="_id")
    project_id: str
    user_id: Optional[str] = None
    job_type: str = "phase"
    phase: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    status: str = "running"
    prompt: Optional[str] = None
    response_excerpt: Optional[str] = None
    duration_ms: Optional[int] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class AiRunResponse(BaseModel):
    """Response payload for AI run history."""

    run_id: str
    project_id: str
    user_id: Optional[str]
    job_type: str
    phase: Optional[str]
    provider: Optional[str]
    model: Optional[str]
    status: str
    prompt_preview: Optional[str]
    response_preview: Optional[str]
    duration_ms: Optional[int]
    error_message: Optional[str]
    metadata: Dict[str, Any]
    created_at: datetime
    completed_at: Optional[datetime]
