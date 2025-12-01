"""User and profile routes."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from models.user import (
    User,
    UserResponse,
    UserProfileUpdate,
    build_user_response,
    MIN_PROJECT_ADMIN_AUTHORITY,
    resolve_role,
)
from models.invite import WorkspaceInviteCreate, WorkspaceInviteResponse
from repositories.user_repository import UserRepository
from repositories.workspace_invite_repository import WorkspaceInviteRepository
from routes.auth import get_current_user


router = APIRouter()
user_repo = UserRepository()
invite_repo = WorkspaceInviteRepository()


@router.get("/me/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return build_user_response(current_user)


@router.patch("/me/profile", response_model=UserResponse)
async def update_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update profile attributes for the authenticated user."""
    updates = payload.model_dump(exclude_unset=True)
    updated = await user_repo.update_profile(current_user.id, updates)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return build_user_response(updated)


def _require_admin(current_user: User) -> None:
    """Ensure the user has authority to manage invites."""
    _, meta = resolve_role(current_user.role)
    if int(meta.get("authority", 1)) < MIN_PROJECT_ADMIN_AUTHORITY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You need Program Manager access to manage workspace invites.",
        )


@router.get("/invites/", response_model=List[WorkspaceInviteResponse])
async def list_invites(current_user: User = Depends(get_current_user)):
    """List pending invites for the current user's organization."""
    _require_admin(current_user)
    invites = await invite_repo.list_org_invites(current_user.organization)
    return [
        WorkspaceInviteResponse(
            id=invite.id,
            email=invite.email,
            role=invite.role,
            status=invite.status,
            invited_by=invite.invited_by,
            organization=invite.organization,
            message=invite.message,
            created_at=invite.created_at,
            accepted_at=invite.accepted_at,
            accepted_by=invite.accepted_by,
        )
        for invite in invites
    ]


@router.post("/invites/", response_model=WorkspaceInviteResponse)
async def create_invite(
    payload: WorkspaceInviteCreate,
    current_user: User = Depends(get_current_user),
):
    """Invite a teammate to the workspace via email."""
    _require_admin(current_user)
    email = payload.email.lower()

    existing = await user_repo.get_by_email(email)
    if existing and existing.organization == current_user.organization:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account is already part of your workspace.",
        )

    invite = await invite_repo.create_invite(
        current_user.organization,
        email,
        payload.role,
        current_user.id,
        payload.message,
    )

    # If the user already exists elsewhere, automatically assign them to this workspace.
    if existing:
        await user_repo.update_workspace(existing.id, current_user.organization, payload.role)
        await invite_repo.mark_accepted(invite.id, existing.id)
        invite.status = "accepted"
        invite.accepted_by = existing.id
        invite.accepted_at = invite.created_at

    return WorkspaceInviteResponse(
        id=invite.id,
        email=invite.email,
        role=invite.role,
        status=invite.status,
        invited_by=invite.invited_by,
        organization=invite.organization,
        message=invite.message,
        created_at=invite.created_at,
        accepted_at=invite.accepted_at,
        accepted_by=invite.accepted_by,
    )


@router.delete("/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_invite(
    invite_id: str,
    current_user: User = Depends(get_current_user),
):
    """Revoke a pending invite."""
    _require_admin(current_user)
    removed = await invite_repo.revoke_invite(invite_id, current_user.organization)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
    return
