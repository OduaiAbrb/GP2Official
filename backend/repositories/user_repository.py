"""User repository."""

from typing import Optional, Dict, Any
from datetime import datetime
import bcrypt

from database import get_db
from models.user import User, UserCreate, resolve_role


class UserRepository:
    """Repository for user data access."""
    
    def __init__(self):
        self.collection_name = "users"
    
    async def create(self, user_data: UserCreate) -> User:
        """Create a new user."""
        db = get_db()

        role_key, _ = resolve_role(user_data.role)
        
        # Hash password (truncate to 72 bytes for bcrypt)
        password_bytes = user_data.password.encode("utf-8")
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        hashed_password = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode()
        
        # Create user document
        user_doc = {
            "_id": str(datetime.utcnow().timestamp()).replace('.', '') + user_data.email[:5],
            "email": user_data.email.lower(),
            "full_name": user_data.full_name,
            "organization": user_data.organization or "Private Workspace",
            "hashed_password": hashed_password,
            "is_active": True,
            "role": role_key,
            "created_at": datetime.utcnow(),
            "avatar_url": None,
            "banner_url": None,
            "bio": "",
            "job_title": None,
            "location": None,
            "timezone": None,
            "pronouns": None,
            "skills": [],
            "interests": [],
            "social_links": [],
            "availability": None,
            "contact_email": None,
            "phone": None,
        }
        
        await db[self.collection_name].insert_one(user_doc)
        return User(**user_doc)
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        db = get_db()
        user_doc = await db[self.collection_name].find_one({"email": email.lower()})
        if user_doc:
            return User(**user_doc)
        return None
    
    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        db = get_db()
        user_doc = await db[self.collection_name].find_one({"_id": user_id})
        if user_doc:
            return User(**user_doc)
        return None

    async def update_profile(self, user_id: str, updates: Dict[str, Any]) -> Optional[User]:
        """Update profile attributes for a user."""
        if not updates:
            return await self.get_by_id(user_id)
        db = get_db()
        updates["updated_at"] = datetime.utcnow()
        result = await db[self.collection_name].find_one_and_update(
            {"_id": user_id},
            {"$set": updates},
            return_document=True,
        )
        if not result:
            return None
        return User(**result)

    async def update_workspace(self, user_id: str, organization: str, role: str) -> Optional[User]:
        """Assign user to a workspace and role."""
        db = get_db()
        updates = {
            "organization": organization,
            "role": resolve_role(role)[0],
            "updated_at": datetime.utcnow(),
        }
        result = await db[self.collection_name].find_one_and_update(
            {"_id": user_id},
            {"$set": updates},
            return_document=True,
        )
        if not result:
            return None
        return User(**result)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password."""
        password_bytes = plain_password.encode("utf-8")
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        return bcrypt.checkpw(password_bytes, hashed_password.encode())
