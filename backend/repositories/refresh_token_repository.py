"""Refresh token repository."""

from datetime import datetime
from typing import Optional

from database import get_db
from models.token import RefreshToken


class RefreshTokenRepository:
    """Manage persistence of refresh tokens."""

    def __init__(self) -> None:
        self.collection_name = "refresh_tokens"

    async def create_token(
        self,
        *,
        user_id: str,
        token_hash: str,
        expires_at: datetime,
        user_agent: Optional[str],
        ip_address: Optional[str],
    ) -> RefreshToken:
        """Store new refresh token metadata."""
        db = get_db()
        now = datetime.utcnow()
        doc = {
            "_id": f"refresh_{str(now.timestamp()).replace('.', '')}",
            "user_id": user_id,
            "token_hash": token_hash,
            "user_agent": (user_agent or "")[:200],
            "ip_address": ip_address,
            "created_at": now,
            "expires_at": expires_at,
            "revoked": False,
            "revoked_at": None,
        }
        await db[self.collection_name].insert_one(doc)
        return RefreshToken(**doc)

    async def get_active_token(self, token_hash: str) -> Optional[RefreshToken]:
        """Return token if hash matches a non-expired, non-revoked entry."""
        db = get_db()
        doc = await db[self.collection_name].find_one(
            {
                "token_hash": token_hash,
                "revoked": False,
                "expires_at": {"$gt": datetime.utcnow()},
            }
        )
        if doc:
            return RefreshToken(**doc)
        return None

    async def revoke_token(self, token_id: str) -> None:
        """Mark token as revoked."""
        db = get_db()
        await db[self.collection_name].update_one(
            {"_id": token_id},
            {"$set": {"revoked": True, "revoked_at": datetime.utcnow()}},
        )

    async def revoke_by_hash(self, token_hash: str) -> None:
        """Revoke token by hash."""
        db = get_db()
        await db[self.collection_name].update_many(
            {"token_hash": token_hash, "revoked": False},
            {"$set": {"revoked": True, "revoked_at": datetime.utcnow()}},
        )

    async def revoke_user_tokens(self, user_id: str) -> None:
        """Revoke all tokens for a user (e.g., on password reset)."""
        db = get_db()
        await db[self.collection_name].update_many(
            {"user_id": user_id, "revoked": False},
            {"$set": {"revoked": True, "revoked_at": datetime.utcnow()}},
        )
