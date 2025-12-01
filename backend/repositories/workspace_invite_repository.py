"""Workspace invite repository."""

from typing import List, Optional
from datetime import datetime
import secrets

from database import get_db
from models.invite import WorkspaceInvite


class WorkspaceInviteRepository:
    """Manage workspace invite persistence."""

    def __init__(self):
        self.collection_name = "workspace_invites"

    async def create_invite(
        self,
        organization: str,
        email: str,
        role: str,
        invited_by: str,
        message: str | None = None,
    ) -> WorkspaceInvite:
        """Create and store a new invite."""
        db = get_db()
        token = secrets.token_urlsafe(24)
        doc = {
            "_id": f"invite_{str(datetime.utcnow().timestamp()).replace('.', '')}",
            "organization": organization,
            "email": email.lower(),
            "role": role,
            "status": "pending",
            "invited_by": invited_by,
            "message": message,
            "token": token,
            "created_at": datetime.utcnow(),
            "accepted_at": None,
            "accepted_by": None,
        }
        await db[self.collection_name].insert_one(doc)
        return WorkspaceInvite(**doc)

    async def list_org_invites(self, organization: str) -> List[WorkspaceInvite]:
        """List workspace invites for an organization."""
        db = get_db()
        invites: List[WorkspaceInvite] = []
        cursor = db[self.collection_name].find({"organization": organization}).sort("created_at", -1)
        async for doc in cursor:
            invites.append(WorkspaceInvite(**doc))
        return invites

    async def find_pending_for_email(self, email: str) -> Optional[WorkspaceInvite]:
        """Return the newest pending invite for an email."""
        db = get_db()
        doc = await db[self.collection_name].find_one(
            {"email": email.lower(), "status": "pending"},
            sort=[("created_at", -1)],
        )
        if doc:
            return WorkspaceInvite(**doc)
        return None

    async def mark_accepted(self, invite_id: str, user_id: str) -> None:
        """Mark invite as accepted."""
        db = get_db()
        await db[self.collection_name].update_one(
            {"_id": invite_id},
            {
                "$set": {
                    "status": "accepted",
                    "accepted_at": datetime.utcnow(),
                    "accepted_by": user_id,
                }
            },
        )

    async def revoke_invite(self, invite_id: str, organization: str) -> bool:
        """Delete/revoke an invite."""
        db = get_db()
        result = await db[self.collection_name].delete_one({"_id": invite_id, "organization": organization})
        return result.deleted_count > 0
