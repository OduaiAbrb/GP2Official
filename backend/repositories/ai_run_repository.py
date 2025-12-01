"""Repository for AI run audit trail."""

from datetime import datetime
from typing import Dict, List, Optional

from database import get_db
from models.ai_run import AiRun


class AiRunRepository:
    """Persist and query AI execution records."""

    def __init__(self) -> None:
        self.collection_name = "ai_runs"

    async def create_run(
        self,
        *,
        project_id: str,
        user_id: Optional[str],
        job_type: str,
        phase: Optional[str],
        provider: Optional[str],
        model: Optional[str],
        prompt: Optional[str],
        metadata: Optional[Dict] = None,
    ) -> AiRun:
        """Create an audit entry for a new AI call."""
        db = get_db()
        now = datetime.utcnow()
        doc = {
            "_id": f"ai_run_{str(now.timestamp()).replace('.', '')}",
            "project_id": project_id,
            "user_id": user_id,
            "job_type": job_type,
            "phase": phase,
            "provider": provider,
            "model": model,
            "status": "running",
            "prompt": (prompt or "")[:2000] if prompt else None,
            "response_excerpt": None,
            "duration_ms": None,
            "error_message": None,
            "metadata": metadata or {},
            "created_at": now,
            "completed_at": None,
            "updated_at": now,
        }
        await db[self.collection_name].insert_one(doc)
        return AiRun(**doc)

    async def complete_run(
        self,
        run_id: str,
        *,
        status: str,
        response: Optional[str] = None,
        duration_ms: Optional[int] = None,
        error_message: Optional[str] = None,
        metadata: Optional[Dict] = None,
    ) -> Optional[AiRun]:
        """Mark a run as completed."""
        db = get_db()
        now = datetime.utcnow()
        updates: Dict = {
            "status": status,
            "completed_at": now,
            "updated_at": now,
        }
        if response is not None:
            updates["response_excerpt"] = response[:2000]
        if duration_ms is not None:
            updates["duration_ms"] = duration_ms
        if error_message is not None:
            updates["error_message"] = error_message[:500]
        if metadata:
            updates.setdefault("metadata", {}).update(metadata)

        result = await db[self.collection_name].find_one_and_update(
            {"_id": run_id},
            {"$set": updates},
            return_document=True,
        )
        if not result:
            return None
        return AiRun(**result)

    async def list_by_project(self, project_id: str, limit: int = 25) -> List[AiRun]:
        """Return the most recent runs for a project."""
        db = get_db()
        cursor = (
            db[self.collection_name]
            .find({"project_id": project_id})
            .sort("created_at", -1)
            .limit(limit)
        )
        runs: List[AiRun] = []
        async for doc in cursor:
            runs.append(AiRun(**doc))
        return runs

    async def list_by_projects(self, project_ids: List[str], limit: int = 200) -> List[AiRun]:
        """Return recent runs for multiple projects."""
        if not project_ids:
            return []
        db = get_db()
        cursor = (
            db[self.collection_name]
            .find({"project_id": {"$in": project_ids}})
            .sort("created_at", -1)
            .limit(limit)
        )
        runs: List[AiRun] = []
        async for doc in cursor:
            runs.append(AiRun(**doc))
        return runs
