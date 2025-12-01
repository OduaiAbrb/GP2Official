"""Workspace invite models."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class WorkspaceInvite(BaseModel):
    """Workspace invite document."""
    id: str = Field(..., alias="_id")
    organization: str
    email: EmailStr
    role: str
    status: str
    invited_by: str
    message: Optional[str] = None
    token: str
    created_at: datetime
    accepted_at: Optional[datetime] = None
    accepted_by: Optional[str] = None

    class Config:
        populate_by_name = True


class WorkspaceInviteCreate(BaseModel):
    """Payload to create an invite."""
    email: EmailStr
    role: str
    message: Optional[str] = None


class WorkspaceInviteResponse(BaseModel):
    """Invite response payload."""
    id: str
    email: EmailStr
    role: str
    status: str
    invited_by: str
    organization: str
    message: Optional[str] = None
    created_at: datetime
    accepted_at: Optional[datetime] = None
    accepted_by: Optional[str] = None
