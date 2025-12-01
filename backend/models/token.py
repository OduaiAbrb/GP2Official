"""Token models."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class RefreshToken(BaseModel):
    """Persisted refresh token record."""

    id: str = Field(..., alias="_id")
    user_id: str
    token_hash: str
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    revoked: bool = False
    revoked_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
