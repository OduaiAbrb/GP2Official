"""Artifact repository."""

from typing import List, Optional
from datetime import datetime
from database import get_db
from models.artifact import Artifact


class ArtifactRepository:
    """Data access for project artifacts."""

    def __init__(self):
        self.collection_name = "artifacts"

    async def upsert_artifact(
        self,
        project_id: str,
        artifact_type: str,
        title: str,
        content_json: dict,
        metadata: Optional[dict] = None,
    ) -> Artifact:
        """Create or update an artifact for a project."""
        db = get_db()
        now = datetime.utcnow()
        result = await db[self.collection_name].find_one_and_update(
            {"project_id": project_id, "type": artifact_type},
            {
                "$set": {
                    "title": title,
                    "content_json": content_json,
                    "metadata": metadata or {},
                    "updated_at": now,
                },
                "$setOnInsert": {
                    "_id": f"artifact_{str(now.timestamp()).replace('.', '')}",
                    "project_id": project_id,
                    "type": artifact_type,
                    "version": 1,
                    "is_approved": False,
                    "created_at": now,
                },
            },
            return_document=True,
            upsert=True,
        )
        return Artifact(**result)

    async def list_by_project(self, project_id: str, artifact_type: Optional[str] = None) -> List[Artifact]:
        """List artifacts for a project."""
        db = get_db()
        query: dict = {"project_id": project_id}
        if artifact_type:
            query["type"] = artifact_type
        cursor = db[self.collection_name].find(query).sort("created_at", -1)
        artifacts: List[Artifact] = []
        async for doc in cursor:
            artifacts.append(Artifact(**doc))
        return artifacts

    async def update_artifact(self, project_id: str, artifact_id: str, updates: dict) -> Optional[Artifact]:
        """Update an artifact document by id."""
        if not updates:
            return None
        db = get_db()
        now = datetime.utcnow()
        payload = {k: v for k, v in updates.items() if v is not None}
        if not payload:
            return None
        payload["updated_at"] = now
        result = await db[self.collection_name].find_one_and_update(
            {"project_id": project_id, "_id": artifact_id},
            {"$set": payload},
            return_document=True,
        )
        if not result:
            return None
        return Artifact(**result)

    async def clone_project_artifacts(self, source_project_id: str, target_project_id: str) -> List[Artifact]:
        """Duplicate artifacts from one project to another."""
        db = get_db()
        cursor = db[self.collection_name].find({"project_id": source_project_id})
        docs: List[dict] = []
        async for doc in cursor:
            new_doc = doc.copy()
            new_doc["_id"] = f"artifact_{str(datetime.utcnow().timestamp()).replace('.', '')}"
            new_doc["project_id"] = target_project_id
            now = datetime.utcnow()
            new_doc["created_at"] = now
            new_doc["updated_at"] = now
            docs.append(new_doc)
        if docs:
            await db[self.collection_name].insert_many(docs)
        return [Artifact(**doc) for doc in docs]
